import assert from 'node:assert/strict'
import test from 'node:test'
import { createRefs } from './refs.ts'

test('only refs seen in tool results become links, one URL per type', () => {
  const refs = createRefs()
  refs.add('order', 'o1', { numero: 'OS-2026-1234' })
  refs.add('customer', 'c1', { nome: 'João' })
  refs.add('vehicle', 'v1', { placa: 'ABC1D23' })
  refs.add('appointment', 'a1', { inicio: '2026-10-02T13:00:00+00:00' })
  refs.add('account', 'f1', { descricao: 'Energia' })
  refs.add('account', 'f2', { descricao: 'Água' })
  assert.deepEqual(refs.links([
    { type: 'order', id: 'o1' },
    { type: 'order', id: 'nope' },
    { type: 'customer', id: 'c1' },
    { type: 'vehicle', id: 'v1' },
    { type: 'appointment', id: 'a1' },
    { type: 'account', id: 'f1' },
    { type: 'account', id: 'f2' },
    'lixo',
    { type: 'order' }
  ]), [
    { label: 'Abrir OS-2026-1234', to: '/ordens/o1' },
    { label: 'Abrir João', to: '/clientes/c1' },
    { label: 'Abrir ABC1D23', to: '/veiculos/v1' },
    { label: 'Abrir agenda de 02/10', to: '/agendamentos?dia=2026-10-02' },
    { label: 'Abrir contas a pagar', to: '/gestao/financeiro?aba=contas' }
  ])
})

test('missing label fields fall back to a generic label', () => {
  const refs = createRefs()
  refs.add('order', 'o1', {})
  refs.add('customer', 'c1', { nome: null })
  refs.add('vehicle', 'v1', {})
  assert.deepEqual(refs.links([{ type: 'order', id: 'o1' }, { type: 'customer', id: 'c1' }, { type: 'vehicle', id: 'v1' }]).map(link => link.label), [
    'Abrir OS', 'Abrir cliente', 'Abrir veículo'
  ])
})

test('appointment day uses the shop timezone', () => {
  const refs = createRefs()
  refs.add('appointment', 'a1', { inicio: '2026-10-03T01:30:00+00:00' })
  assert.equal(refs.links([{ type: 'appointment', id: 'a1' }])[0]?.to, '/agendamentos?dia=2026-10-02')
})

test('at most 5 links; non-array refs give none', () => {
  const refs = createRefs()
  for (let i = 0; i < 7; i++) refs.add('order', `o${i}`, { numero: String(i) })
  assert.equal(refs.links(Array.from({ length: 7 }, (_, i) => ({ type: 'order', id: `o${i}` }))).length, 5)
  assert.deepEqual(refs.links(undefined), [])
})
