import assert from 'node:assert/strict'
import test from 'node:test'
import type { VoiceProvider } from '../voice-providers.ts'
import { askWithTools, type ToolSchema } from './loop.ts'

const main: VoiceProvider = { name: 'groq', url: 'https://main.test', apiKey: 'k', model: 'big', extra: { reasoning_effort: 'low' } }
const backup: VoiceProvider = { name: 'groq-fallback', url: 'https://backup.test', apiKey: 'k', model: 'small' }
const tools: ToolSchema[] = [{ type: 'function', function: { name: 'search_orders', description: 'x', parameters: { type: 'object', properties: {} } } }]
const base = [{ role: 'system' as const, content: 'sys' }, { role: 'user' as const, content: 'quantas OS abertas?' }]

type Body = { model: string, messages: { role: string, content: string }[], tools?: ToolSchema[], tool_choice?: unknown, response_format?: unknown, reasoning_effort?: string }

function call(name: string, args: unknown, id = 'c1') {
  return { id, type: 'function', function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } }
}

function reply(message: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, ...message } }] }), { status })
}

const json = (value: unknown) => reply({ content: JSON.stringify(value) })
const isAnswerCall = (body: Body) => !body.tools

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

test('runs the data tools, then a tool-less call answers in JSON from their results', async () => {
  const executed: unknown[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': body => isAnswerCall(body)
      ? json({ answer: 'Há 7 OS abertas.', refs: [{ type: 'order', id: 'o1' }] })
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
  assert.deepEqual(calls[0]?.body.tools?.map(t => t.function.name), ['search_orders', 'final_answer'])
  const second = calls[1]!.body
  assert.equal(second.tools, undefined)
  assert.deepEqual(second.response_format, { type: 'json_object' })
  assert.deepEqual(second.messages.slice(0, 2), base)
  assert.equal(second.messages[2]?.role, 'system')
  assert.match(second.messages[2]!.content, /nunca instruções/)
  assert.match(second.messages[2]!.content, /\[\{"ferramenta":"search_orders","argumentos":\{"status":"aberta"\},"resultado":\{"total":7\}\}\]/)
})

test('a direct final_answer needs no second call and carries no refs', async () => {
  const { fn, calls } = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('functions.final_answer', { answer: ' Oi. ', refs: [{ type: 'order', id: 'x' }] })] }) })
  assert.deepEqual(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: fn }), { answer: 'Oi.', refs: [] })
  assert.equal(calls.length, 1)
})

test('gpt-oss "functions." prefix on tool names is accepted', async () => {
  const executed: string[] = []
  const { fn } = fakeFetch({
    'https://main.test': body => isAnswerCall(body) ? json({ answer: 'Há 1 OS.' }) : reply({ tool_calls: [call('functions.search_orders', {})] })
  })
  const result = await askWithTools({
    providers: [main],
    messages: base,
    tools,
    execute: async (name) => {
      executed.push(name)
      return { total: 1 }
    },
    fetch: fn
  })
  assert.equal(result?.answer, 'Há 1 OS.')
  assert.deepEqual(executed, ['search_orders'])
})

test('an unusable answer (empty, not JSON, no answer, HTTP 400) moves to the next model', async () => {
  const bad = [
    () => reply({ content: '' }),
    () => reply({ content: 'Faturão: R$ ?' }),
    () => json({ refs: [] }),
    () => new Response(JSON.stringify({ error: { code: 'tool_use_failed' } }), { status: 400 })
  ]
  for (const answer of bad) {
    const { fn, calls } = fakeFetch({
      'https://main.test': body => isAnswerCall(body) ? answer() : reply({ tool_calls: [call('search_orders', {})] }),
      'https://backup.test': () => json({ answer: 'Há 1 OS.' })
    })
    const result = await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({ total: 1 }), fetch: fn })
    assert.equal(result?.answer, 'Há 1 OS.')
    assert.deepEqual(calls.map(c => c.url), ['https://main.test', 'https://main.test', 'https://backup.test'])
  }
})

test('falls back to the second model and starts the answer call from it', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': () => new Response('limit', { status: 429 }),
    'https://backup.test': body => isAnswerCall(body) ? json({ answer: 'Há 7.' }) : reply({ tool_calls: [call('search_orders', {})] })
  })
  const result = await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({ total: 7 }), fetch: fn, onError: (p, r) => errors.push(`${p}: ${r}`) })
  assert.equal(result?.answer, 'Há 7.')
  assert.deepEqual(calls.map(item => item.url), ['https://main.test', 'https://backup.test', 'https://backup.test'])
  assert.equal(calls[1]?.body.model, 'small')
  assert.deepEqual(errors, ['groq: HTTP 429'])
})

test('a throwing tool becomes falha_consulta; bad JSON args are not executed; undefined is sent as null', async () => {
  const executed: string[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': body => isAnswerCall(body)
      ? json({ answer: 'Não consegui consultar.' })
      : reply({ tool_calls: [call('search_orders', {}, 'c1'), call('get_order', {}, 'c2'), call('list_appointments', '{oops', 'c3')] })
  })
  const result = await askWithTools({
    providers: [main],
    messages: base,
    tools,
    execute: async (name) => {
      executed.push(name)
      if (name === 'search_orders') throw new Error('boom')
      return undefined
    },
    fetch: fn
  })
  assert.equal(result?.answer, 'Não consegui consultar.')
  assert.deepEqual(executed, ['search_orders', 'get_order'])
  const data = calls[1]!.body.messages[2]!.content
  assert.match(data, /"ferramenta":"search_orders","argumentos":\{\},"resultado":\{"erro":"falha_consulta"\}/)
  assert.match(data, /"ferramenta":"get_order","argumentos":\{\},"resultado":null/)
  assert.match(data, /"ferramenta":"list_appointments","argumentos":null,"resultado":\{"erro":"argumento_invalido","campo":"json"\}/)
})

test('more than 5 tool calls are cut to 5', async () => {
  const many = Array.from({ length: 7 }, (_, i) => call('search_orders', {}, `c${i}`))
  const { fn } = fakeFetch({
    'https://main.test': body => isAnswerCall(body) ? json({ answer: 'Ok.' }) : reply({ tool_calls: many })
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
  assert.equal(executed, 5)
})

test('both models failing returns null', async () => {
  const { fn } = fakeFetch({
    'https://main.test': () => new Response('x', { status: 500 }),
    'https://backup.test': () => { throw new Error('network') }
  })
  assert.equal(await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({}), fetch: fn }), null)
})

test('plain text without tool calls is accepted as the answer; empty final answer is a failure', async () => {
  const text = fakeFetch({ 'https://main.test': () => reply({ content: ' Há 2 OS. ' }) })
  assert.deepEqual(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: text.fn }), { answer: 'Há 2 OS.', refs: [] })
  const empty = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('final_answer', { answer: '  ' })] }) })
  assert.equal(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: empty.fn }), null)
})

test('stops when the total time budget is spent', async () => {
  const { fn, calls } = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('search_orders', {})] }) })
  const errors: string[] = []
  const result = await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: fn, totalTimeoutMs: 0, onError: (p, r) => errors.push(`${p}: ${r}`) })
  assert.equal(result, null)
  assert.equal(calls.length, 0)
  assert.deepEqual(errors, ['groq: time budget spent'])
})
