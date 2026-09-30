import assert from 'node:assert/strict'
import test from 'node:test'
import { applyVoiceFields, voiceBudgetItem } from './apply.ts'
import { VOICE_CATALOG } from './catalog.ts'

test('append, replace and ref stateKey', () => {
  const state: Record<string, unknown> = { reclamacao: 'Barulho', km_entrada: 10, veiculo_id: '' }
  const written = applyVoiceFields(state, { reclamacao: 'freio', km_entrada: 45000, veiculo: 'v1' }, VOICE_CATALOG.order)
  assert.deepEqual(state, { reclamacao: 'Barulho. freio', km_entrada: 45000, veiculo_id: 'v1' })
  assert.deepEqual(written, ['reclamacao', 'km_entrada', 'veiculo_id'])
})

test('lists add without duplicates (compared before formatting), ignoring blanks', () => {
  const state: Record<string, unknown> = { telefones: ['(11) 98888-7777', ''], emails: [] }
  applyVoiceFields(state, { telefones: ['11988887777', '11977776666', '11977776666'], emails: ['a@b.com'] }, VOICE_CATALOG.customer, {
    format: { telefones: v => `fmt:${String(v)}` }
  })
  assert.deepEqual(state.telefones, ['(11) 98888-7777', 'fmt:11977776666'])
  assert.deepEqual(state.emails, ['a@b.com'])
})

test('only restricts fields; unknown fields are ignored', () => {
  const state: Record<string, unknown> = {}
  applyVoiceFields(state, { pago: true, reclamacao: 'x', nope: 1 }, VOICE_CATALOG.order, { only: ['pago'] })
  assert.deepEqual(state, { pago: true })
})

test('text fields without append replace', () => {
  const state: Record<string, unknown> = { nome: 'João' }
  applyVoiceFields(state, { nome: 'João da Silva' }, VOICE_CATALOG.customer)
  assert.equal(state.nome, 'João da Silva')
})

test('voiceBudgetItem defaults tipo and copies known values', () => {
  assert.deepEqual(voiceBudgetItem({ descricao: 'Mão de obra', valor_unitario: 80, catalogItemId: 'c1' }),
    { tipo: 'servico', descricao: 'Mão de obra', valor_unitario: 80, catalogItemId: 'c1' })
})
