import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeVoiceCommand as n } from './normalize.ts'

test('rejects non-objects, unknown ops and entities', () => {
  assert.equal(n(null), null)
  assert.equal(n('x'), null)
  assert.equal(n({ op: null }), null)
  assert.equal(n({ op: 'create', entity: 'boleto' }), null)
  assert.equal(n({ op: 'create', entity: '__proto__' }), null)
})

test('order edit keeps valid fields, target and items; drops unknown, password and create-only fields', () => {
  assert.deepEqual(n({
    op: 'edit',
    entity: 'order',
    target: { placa: 'abc-1d23', foo: 'x' },
    fields: { forma_pagamento: 'pix', parcelas: '3', senha: '1234', veiculo: 'ABC1D23', valor_cobrado: '1.500,5', status: 'voando' },
    items: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150 }, { tipo: 'peca' }, 'x']
  }), {
    op: 'edit',
    entity: 'order',
    target: { placa: 'ABC1D23' },
    fields: { forma_pagamento: 'pix', parcelas: 3, valor_cobrado: 1500.5 },
    items: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150 }]
  })
})

test('create ignores target and edit-only fields', () => {
  assert.deepEqual(n({ op: 'create', entity: 'order', target: { placa: 'ABC1D23' }, fields: { veiculo: 'abc1d23', status: 'aberta', reclamacao: ' barulho ' } }),
    { op: 'create', entity: 'order', fields: { veiculo: 'ABC1D23', reclamacao: 'barulho' } })
})

test('create takes the plate the AI put in target when the plate field was not given', () => {
  assert.deepEqual(n({ op: 'create', entity: 'order', target: { placa: 'abc-1d23' }, fields: {} }),
    { op: 'create', entity: 'order', fields: { veiculo: 'ABC1D23' } })
  assert.deepEqual(n({ op: 'create', entity: 'appointment', target: { placa: 'ABC1D23' }, fields: { startTime: '09:00' } }),
    { op: 'create', entity: 'appointment', fields: { startTime: '09:00', veiculo: 'ABC1D23' } })
  assert.deepEqual(n({ op: 'create', entity: 'vehicle', target: { placa: 'ABC1D23' } }),
    { op: 'create', entity: 'vehicle', fields: { placa: 'ABC1D23' } })
  assert.deepEqual(n({ op: 'create', entity: 'customer', target: { placa: 'ABC1D23' } }), { op: 'create', entity: 'customer' })
})

test('number limits and types', () => {
  assert.deepEqual(n({ op: 'edit', entity: 'order', fields: { parcelas: 13, km_entrada: -1, pago: 'true' } }),
    { op: 'edit', entity: 'order', fields: { pago: true } })
  assert.deepEqual(n({ op: 'edit', entity: 'pricing', fields: { valor_hora: '120', precificacao_automatica: false, margem_alvo: 'muito' } }),
    { op: 'edit', entity: 'pricing', fields: { valor_hora: 120, precificacao_automatica: false } })
})

test('lists keep valid items only, capped at 10', () => {
  const phones = Array.from({ length: 12 }, (_, i) => `11 9888${String(i).padStart(2, '0')}-7777`)
  const result = n({ op: 'create', entity: 'customer', fields: { telefones: phones, emails: ['A@B.COM', 'nope'] } })
  assert.equal((result?.fields?.telefones as string[]).length, 10)
  assert.equal((result?.fields?.telefones as string[])[0], '119888007777')
  assert.deepEqual(result?.fields?.emails, ['a@b.com'])
})

test('items capped at 20 and long text truncated at 1000 chars', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ descricao: `Item ${i}` }))
  const result = n({ op: 'edit', entity: 'order', fields: { reclamacao: 'a'.repeat(1500) }, items })
  assert.equal(result?.items?.length, 20)
  assert.equal((result?.fields?.reclamacao as string).length, 1000)
})

test('actions need a known name; args validated', () => {
  assert.deepEqual(n({ op: 'action', entity: 'account', target: { descricao: 'energia' }, action: 'pagar', args: { forma: 'pix', x: 1 } }),
    { op: 'action', entity: 'account', target: { descricao: 'energia' }, action: 'pagar', args: { forma: 'pix' } })
  assert.equal(n({ op: 'action', entity: 'account', action: 'voar' }), null)
  assert.equal(n({ op: 'action', entity: 'account', action: '__proto__' }), null)
  assert.deepEqual(n({ op: 'action', entity: 'order', action: 'aprovar', args: { forma: 'pix' } }), { op: 'action', entity: 'order', action: 'aprovar' })
})

test('edit with nothing valid is a plain open', () => {
  assert.deepEqual(n({ op: 'edit', entity: 'customer', target: { nome: 'João' }, fields: { senha: 'x' } }),
    { op: 'edit', entity: 'customer', target: { nome: 'João' } })
})

test('navigate keeps only the query params the screen declares', () => {
  assert.deepEqual(n({ op: 'navigate', to: 'orders', query: { q: ' João ', status: 'aberta' } }), { op: 'navigate', to: 'orders', query: { q: 'João', status: 'aberta' } })
  assert.deepEqual(n({ op: 'navigate', to: 'orders', query: { status: 'perdida', page: '2' } }), { op: 'navigate', to: 'orders' })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', query: { dia: '2026-10-02', vista: 'week' } }), { op: 'navigate', to: 'scheduling', query: { dia: '2026-10-02', vista: 'week' } })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', query: { dia: '2026-02-30' } }), { op: 'navigate', to: 'scheduling' })
  assert.deepEqual(n({ op: 'navigate', to: 'finance', query: { mes: '2026-08', aba: 'contas' } }), { op: 'navigate', to: 'finance', query: { aba: 'contas', mes: '2026-08' } })
  assert.deepEqual(n({ op: 'navigate', to: 'finance', query: { mes: '2026-13' } }), { op: 'navigate', to: 'finance' })
  assert.equal(n({ op: 'navigate', to: 'orders', query: { q: 'x'.repeat(300) } })?.query?.q?.length, 100)
  assert.deepEqual(n({ op: 'navigate', to: 'team', query: { q: 'Pedro' } }), { op: 'navigate', to: 'team' })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', date: '2026-10-02' }), { op: 'navigate', to: 'scheduling' })
  assert.equal(n({ op: 'navigate', to: 'moon' }), null)
})

test('ask carries no other fields', () => {
  assert.deepEqual(n({ op: 'ask' }), { op: 'ask' })
  assert.deepEqual(n({ op: 'ask', entity: 'order', to: 'home', query: { q: 'x' } }), { op: 'ask' })
})

test('kit items need a non-enum value', () => {
  assert.deepEqual(n({ op: 'create', entity: 'catalogItem', fields: { tipo: 'kit', nome: 'Revisão' }, items: [{ item: 'Filtro de óleo', quantidade: 1 }, { quantidade: 0 }] }),
    { op: 'create', entity: 'catalogItem', fields: { tipo: 'kit', nome: 'Revisão' }, items: [{ item: 'Filtro de óleo', quantidade: 1 }] })
})
