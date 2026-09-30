import assert from 'node:assert/strict'
import test from 'node:test'
import { completeWithFallback, type VoiceProvider } from './voice-providers.ts'

const messages = [{ role: 'user' as const, content: 'oi' }]
const groq: VoiceProvider = { name: 'groq', url: 'https://groq.test', apiKey: 'g', model: 'm1', extra: { reasoning_effort: 'low' } }
const gemini: VoiceProvider = { name: 'gemini', url: 'https://gemini.test', apiKey: 'k', model: 'm2' }

function reply(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })
}

function fakeFetch(handlers: Record<string, () => Response | Promise<Response>>) {
  const calls: { url: string, body: Record<string, unknown>, auth: string | null }[] = []
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get('Authorization') })
    const handler = handlers[url]
    if (!handler) throw new Error(`unexpected ${url}`)
    return handler()
  }) as typeof fetch
  return { fn, calls }
}

test('uses the first provider when it answers', async () => {
  const { fn, calls } = fakeFetch({ 'https://groq.test': () => reply('{"op":"navigate","to":"home"}') })
  const result = await completeWithFallback([groq, gemini], messages, { fetch: fn })
  assert.deepEqual(result, { op: 'navigate', to: 'home' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.auth, 'Bearer g')
  assert.equal(calls[0]?.body.model, 'm1')
  assert.equal(calls[0]?.body.reasoning_effort, 'low')
  assert.deepEqual(calls[0]?.body.response_format, { type: 'json_object' })
})

test('falls back on 429', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://groq.test': () => new Response('limit', { status: 429 }),
    'https://gemini.test': () => reply('```json\n{"op":null}\n```')
  })
  const result = await completeWithFallback([groq, gemini], messages, { fetch: fn, onError: p => errors.push(p) })
  assert.deepEqual(result, { op: null })
  assert.deepEqual(calls.map(c => c.url), ['https://groq.test', 'https://gemini.test'])
  assert.deepEqual(errors, ['groq'])
})

test('falls back on network error and invalid JSON', async () => {
  const { fn, calls } = fakeFetch({
    'https://groq.test': () => { throw new Error('offline') },
    'https://gemini.test': () => reply('not json')
  })
  assert.equal(await completeWithFallback([groq, gemini], messages, { fetch: fn }), null)
  assert.deepEqual(calls.map(c => c.url), ['https://groq.test', 'https://gemini.test'])
})

test('falls back when a provider returns a non-object JSON', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://groq.test': () => reply('null'),
    'https://gemini.test': () => reply('{"op":null}')
  })
  const result = await completeWithFallback([groq, gemini], messages, { fetch: fn, onError: p => errors.push(p) })
  assert.deepEqual(result, { op: null })
  assert.deepEqual(calls.map(c => c.url), ['https://groq.test', 'https://gemini.test'])
  assert.deepEqual(errors, ['groq'])
  assert.equal(await completeWithFallback([groq], messages, { fetch: fakeFetch({ 'https://groq.test': () => reply('42') }).fn }), null)
})

test('cancels the body of a failed response', async () => {
  let cancelled = false
  const body = new ReadableStream({
    cancel() {
      cancelled = true
    }
  })
  const { fn } = fakeFetch({
    'https://groq.test': () => new Response(body, { status: 503 }),
    'https://gemini.test': () => reply('{"op":null}')
  })
  await completeWithFallback([groq, gemini], messages, { fetch: fn })
  assert.equal(cancelled, true)
})

test('falls back on timeout', async () => {
  const { fn } = fakeFetch({
    'https://groq.test': () => new Promise<Response>(() => {}),
    'https://gemini.test': () => reply('{"op":null}')
  })
  const slowAware = (async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input) === 'https://groq.test') {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timeout')))
      })
    }
    return fn(input, init)
  }) as typeof fetch
  const errors: string[] = []
  const result = await completeWithFallback([groq, gemini], messages, { fetch: slowAware, timeoutMs: 20, onError: p => errors.push(p) })
  assert.deepEqual(result, { op: null })
  assert.deepEqual(errors, ['groq'])
})

test('skips providers without key and returns null when none is configured', async () => {
  const { fn, calls } = fakeFetch({ 'https://gemini.test': () => reply('{"op":null}') })
  await completeWithFallback([{ ...groq, apiKey: '' }, gemini], messages, { fetch: fn })
  assert.deepEqual(calls.map(c => c.url), ['https://gemini.test'])
  assert.equal(await completeWithFallback([{ ...groq, apiKey: '' }], messages, { fetch: fn }), null)
})
