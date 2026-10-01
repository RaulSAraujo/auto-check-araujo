import assert from 'node:assert/strict'
import test from 'node:test'
import { voiceAiFailure } from './ai-failure.ts'

test('voiceAiFailure names the quota and the missing key; anything else gets the fallback', () => {
  assert.match(voiceAiFailure({ statusCode: 429 }, 'x'), /limite de uso gratuito/)
  assert.match(voiceAiFailure({ statusCode: 502 }, 'x'), /sem chave válida/)
  assert.equal(voiceAiFailure({ statusCode: 503 }, 'fora'), 'fora')
  assert.equal(voiceAiFailure(new Error('network'), 'fora'), 'fora')
  assert.equal(voiceAiFailure(null, 'fora'), 'fora')
})
