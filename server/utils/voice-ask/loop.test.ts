import assert from 'node:assert/strict'
import test from 'node:test'
import type { VoiceProvider } from '../voice-providers.ts'
import { askWithTools, type ToolSchema } from './loop.ts'

const main: VoiceProvider = { name: 'groq', url: 'https://main.test', apiKey: 'k', model: 'big', extra: { reasoning_effort: 'low' } }
const backup: VoiceProvider = { name: 'groq-fallback', url: 'https://backup.test', apiKey: 'k', model: 'small' }
const tools: ToolSchema[] = [{ type: 'function', function: { name: 'search_orders', description: 'x', parameters: { type: 'object', properties: {} } } }]
const base = [{ role: 'system' as const, content: 'sys' }, { role: 'user' as const, content: 'quantas OS abertas?' }]

type Body = { model: string, messages: Record<string, unknown>[], tools: ToolSchema[], tool_choice: unknown, reasoning_effort?: string }

function call(name: string, args: unknown, id = 'c1') {
  return { id, type: 'function', function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } }
}

function reply(message: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, ...message } }] }), { status })
}

function fakeFetch(handlers: Record<string, (body: Body) => Response>) {
  const calls: { url: string, body: Body }[] = []
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const body = JSON.parse(String(init?.body)) as Body
    calls.push({ url, body })
    const handler = handlers[url]
    if (!handler) throw new Error(`unexpected ${url}`)
    return handler(body)
  }) as typeof fetch
  return { fn, calls }
}

test('runs a data round, then returns final_answer', async () => {
  const executed: unknown[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Há 7 OS abertas.', refs: [{ type: 'order', id: 'o1' }] }, 'c2')] })
      : reply({ tool_calls: [call('search_orders', { status: 'aberta' })] })
  })
  const result = await askWithTools({
    providers: [main, backup],
    messages: base,
    tools,
    execute: async (name, args) => {
      executed.push([name, args])
      return { total: 7 }
    },
    fetch: fn
  })
  assert.deepEqual(result, { answer: 'Há 7 OS abertas.', refs: [{ type: 'order', id: 'o1' }] })
  assert.deepEqual(executed, [['search_orders', { status: 'aberta' }]])
  assert.equal(calls[0]?.body.tool_choice, 'required')
  assert.equal(calls[0]?.body.reasoning_effort, 'low')
  assert.deepEqual(calls[0]?.body.tools.map(t => t.function.name), ['search_orders', 'final_answer'])
  const second = calls[1]!.body.messages
  assert.deepEqual(second.at(-2), { role: 'assistant', content: null, tool_calls: [call('search_orders', { status: 'aberta' })] })
  assert.deepEqual(second.at(-1), { role: 'tool', tool_call_id: 'c1', content: '{"total":7}' })
})

test('forces final_answer after 3 data rounds', async () => {
  const { fn, calls } = fakeFetch({
    'https://main.test': body => typeof body.tool_choice === 'object'
      ? reply({ tool_calls: [call('final_answer', { answer: 'Não encontrei.' }, 'f')] })
      : reply({ tool_calls: [call('search_orders', {})] })
  })
  const result = await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({ total: 0 }), fetch: fn })
  assert.deepEqual(result, { answer: 'Não encontrei.', refs: undefined })
  assert.equal(calls.length, 4)
  assert.deepEqual(calls[3]?.body.tool_choice, { type: 'function', function: { name: 'final_answer' } })
})

test('falls back to the second model and keeps the conversation', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': () => new Response('limit', { status: 429 }),
    'https://backup.test': () => reply({ tool_calls: [call('final_answer', { answer: 'Oi.' })] })
  })
  const result = await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({}), fetch: fn, onError: (p, r) => errors.push(`${p}: ${r}`) })
  assert.equal(result?.answer, 'Oi.')
  assert.equal(calls[1]?.body.model, 'small')
  assert.deepEqual(errors, ['groq: HTTP 429'])
})

test('after a fallback, the next round starts from the model that answered', async () => {
  const { fn, calls } = fakeFetch({
    'https://main.test': () => new Response('limit', { status: 429 }),
    'https://backup.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Há 7.' }, 'c2')] })
      : reply({ tool_calls: [call('search_orders', {})] })
  })
  const result = await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({ total: 7 }), fetch: fn })
  assert.equal(result?.answer, 'Há 7.')
  assert.deepEqual(calls.map(item => item.url), ['https://main.test', 'https://backup.test', 'https://backup.test'])
  assert.deepEqual(calls[2]?.body.messages.at(-1), { role: 'tool', tool_call_id: 'c1', content: '{"total":7}' })
})

test('a throwing tool becomes falha_consulta; an undefined result is sent as null', async () => {
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Não consegui consultar.' }, 'c3')] })
      : reply({ tool_calls: [call('search_orders', {}, 'c1'), call('get_order', {}, 'c2')] })
  })
  const result = await askWithTools({
    providers: [main],
    messages: base,
    tools,
    execute: async (name) => {
      if (name === 'search_orders') throw new Error('boom')
      return undefined
    },
    fetch: fn
  })
  assert.equal(result?.answer, 'Não consegui consultar.')
  assert.deepEqual(calls[1]?.body.messages.slice(-2), [
    { role: 'tool', tool_call_id: 'c1', content: '{"erro":"falha_consulta"}' },
    { role: 'tool', tool_call_id: 'c2', content: 'null' }
  ])
})

test('more than 5 tool calls in a round are cut to 5', async () => {
  const many = Array.from({ length: 7 }, (_, i) => call('search_orders', {}, `c${i}`))
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Ok.' }, 'f')] })
      : reply({ tool_calls: many })
  })
  let executed = 0
  await askWithTools({
    providers: [main],
    messages: base,
    tools,
    execute: async () => {
      executed++
      return {}
    },
    fetch: fn
  })
  const sent = calls[1]!.body.messages.slice(base.length)
  assert.equal(executed, 5)
  assert.equal((sent[0]?.tool_calls as unknown[]).length, 5)
  assert.deepEqual(sent.slice(1).map(m => m.role), ['tool', 'tool', 'tool', 'tool', 'tool'])
})

test('both models failing returns null', async () => {
  const { fn } = fakeFetch({
    'https://main.test': () => new Response('x', { status: 500 }),
    'https://backup.test': () => { throw new Error('network') }
  })
  assert.equal(await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({}), fetch: fn }), null)
})

test('invalid JSON arguments are answered with an error, not executed', async () => {
  let executed = false
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Tente de novo.' }, 'c2')] })
      : reply({ tool_calls: [call('search_orders', '{oops')] })
  })
  await askWithTools({
    providers: [main],
    messages: base,
    tools,
    execute: async () => {
      executed = true
    },
    fetch: fn
  })
  assert.equal(executed, false)
  assert.deepEqual(calls[1]?.body.messages.at(-1), { role: 'tool', tool_call_id: 'c1', content: '{"erro":"argumento_invalido","campo":"json"}' })
})

test('plain text without tool calls is accepted as the answer; empty final answer is a failure', async () => {
  const text = fakeFetch({ 'https://main.test': () => reply({ content: ' Há 2 OS. ' }) })
  assert.deepEqual(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: text.fn }), { answer: 'Há 2 OS.', refs: [] })
  const empty = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('final_answer', { answer: '  ' })] }) })
  assert.equal(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: empty.fn }), null)
})

test('stops when the total time budget is spent', async () => {
  const { fn, calls } = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('search_orders', {})] }) })
  const result = await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: fn, totalTimeoutMs: 0 })
  assert.equal(result, null)
  assert.equal(calls.length, 0)
})
