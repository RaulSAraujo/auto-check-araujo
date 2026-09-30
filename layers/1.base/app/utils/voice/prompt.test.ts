import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVoiceMessages, localDateInput, VOICE_PAGES, voiceEntitiesForPage, voicePageFromPath } from './prompt.ts'

test('voicePageFromPath maps every screen', () => {
  assert.equal(voicePageFromPath('/ordens/novo'), 'order-new')
  assert.equal(voicePageFromPath('/ordens/abc'), 'order-detail')
  assert.equal(voicePageFromPath('/ordens/abc/impressao'), 'other')
  assert.equal(voicePageFromPath('/clientes/novo'), 'customer-new')
  assert.equal(voicePageFromPath('/clientes/abc'), 'customer-detail')
  assert.equal(voicePageFromPath('/veiculos/novo'), 'vehicle-new')
  assert.equal(voicePageFromPath('/veiculos/abc'), 'vehicle-detail')
  assert.equal(voicePageFromPath('/agendamentos'), 'scheduling')
  assert.equal(voicePageFromPath('/gestao/financeiro'), 'finance')
  assert.equal(voicePageFromPath('/configuracao/catalogo'), 'catalog')
  assert.equal(voicePageFromPath('/configuracao/fornecedores'), 'suppliers')
  assert.equal(voicePageFromPath('/gestao/equipe'), 'team')
  assert.equal(voicePageFromPath('/configuracao/precificacao'), 'pricing')
  assert.equal(voicePageFromPath('/'), 'other')
})

test('every entity belongs to a page', () => {
  assert.deepEqual(voiceEntitiesForPage('finance'), ['account', 'category'])
  assert.deepEqual(voiceEntitiesForPage('other'), [])
})

test('prompt has date, page, text, detailed current entity and compact others', () => {
  const [system, user] = buildVoiceMessages('paga no pix', { page: 'order-detail', today: '2026-09-30' })
  assert.equal(user?.content, 'paga no pix')
  assert.match(system!.content, /2026-09-30 \(quarta-feira\)/)
  assert.match(system!.content, /Tela atual: OS aberta/)
  assert.match(system!.content, /forma_pagamento \(dinheiro\|pix\|cartao_credito\|cartao_debito\)/)
  assert.match(system!.content, /- account \(conta a pagar\); target \{descricao\}; fields: descricao, valor/)
  assert.match(system!.content, /Nunca inclua senha/)
})

test('prompt stays under the token budget on every page', () => {
  for (const page of VOICE_PAGES) {
    const [system] = buildVoiceMessages('x', { page, today: '2026-09-30' })
    assert.ok(system!.content.length <= 6000, `${page}: ${system!.content.length}`)
  }
})

test('localDateInput', () => {
  assert.equal(localDateInput(new Date(2026, 0, 5)), '2026-01-05')
})
