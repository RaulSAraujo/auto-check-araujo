import assert from 'node:assert/strict'
import test from 'node:test'
import { readQueryValue, withQueryValue } from './route-query.ts'

const isMonth = (value: string) => /^\d{4}-\d{2}$/.test(value)

test('readQueryValue falls back when missing, empty, repeated or not allowed', () => {
  assert.equal(readQueryValue(undefined, 'all'), 'all')
  assert.equal(readQueryValue('', 'all'), 'all')
  assert.equal(readQueryValue(['aberta'], 'all'), 'all')
  assert.equal(readQueryValue('aberta', 'all', ['all', 'aberta']), 'aberta')
  assert.equal(readQueryValue('perdida', 'all', ['all', 'aberta']), 'all')
  assert.equal(readQueryValue('2026-08', '2026-09', isMonth), '2026-08')
  assert.equal(readQueryValue('agosto', '2026-09', isMonth), '2026-09')
  assert.equal(readQueryValue('João ', ''), 'João ')
})

test('withQueryValue keeps other keys and omits the default or blank value', () => {
  assert.deepEqual(withQueryValue({ q: 'João' }, 'status', 'aberta', 'all'), { q: 'João', status: 'aberta' })
  assert.deepEqual(withQueryValue({ q: 'João', status: 'aberta' }, 'status', 'all', 'all'), { q: 'João' })
  assert.deepEqual(withQueryValue({ q: 'João', status: 'aberta' }, 'q', '  ', ''), { status: 'aberta' })
})
