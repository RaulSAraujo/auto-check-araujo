import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dictatedField } from './dictation.ts'

test('a phrase that starts with a field name fills only that field with the whole rest', () => {
  assert.deepEqual(dictatedField('diagnostico problema falta de revisão e alinhamento e balanceamento', 'order-detail'),
    { op: 'edit', entity: 'order', fields: { diagnostico: 'Falta de revisão e alinhamento e balanceamento' } })
  assert.deepEqual(dictatedField('Diagnóstico, problema: falta de revisão e alinhamento e balanceamento.', 'order-detail'),
    { op: 'edit', entity: 'order', fields: { diagnostico: 'Falta de revisão e alinhamento e balanceamento' } })
  assert.deepEqual(dictatedField('Reclamação barulho na suspensão e troca de óleo', 'order-detail'),
    { op: 'edit', entity: 'order', fields: { reclamacao: 'Barulho na suspensão e troca de óleo' } })
  assert.deepEqual(dictatedField('observações cliente busca às 18h', 'order-detail'),
    { op: 'edit', entity: 'order', fields: { observacoes: 'Cliente busca às 18h' } })
})

test('anything else is left to the AI', () => {
  assert.equal(dictatedField('diagnóstico falta de revisão', 'order-new'), null)
  assert.equal(dictatedField('coloca alinhamento e balanceamento', 'order-detail'), null)
  assert.equal(dictatedField('o diagnóstico é falta de revisão', 'order-detail'), null)
  assert.equal(dictatedField('diagnóstico', 'order-detail'), null)
  assert.equal(dictatedField('diagnosticou falta de óleo', 'order-detail'), null)
})
