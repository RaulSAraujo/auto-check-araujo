import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVoiceMessages, localDateInput, voicePageFromPath } from './prompt.ts'

test('buildVoiceMessages embeds date, weekday, page and speech', () => {
  const messages = buildVoiceMessages('diagnóstico pastilha gasta', { page: 'order-detail', today: '2026-09-29' })
  assert.equal(messages.length, 2)
  assert.equal(messages[0]?.role, 'system')
  assert.match(messages[0]!.content, /2026-09-29/)
  assert.match(messages[0]!.content, /terça-feira/)
  assert.match(messages[0]!.content, /OS aberta/)
  assert.match(messages[0]!.content, /NUNCA inclua senha/)
  assert.deepEqual(messages[1], { role: 'user', content: 'diagnóstico pastilha gasta' })
})

test('voicePageFromPath', () => {
  assert.equal(voicePageFromPath('/ordens/abc-123'), 'order-detail')
  assert.equal(voicePageFromPath('/ordens/novo'), 'other')
  assert.equal(voicePageFromPath('/ordens'), 'other')
  assert.equal(voicePageFromPath('/clientes/xyz'), 'customer-detail')
  assert.equal(voicePageFromPath('/veiculos/xyz'), 'vehicle-detail')
  assert.equal(voicePageFromPath('/veiculos/novo'), 'other')
  assert.equal(voicePageFromPath('/agendamentos'), 'scheduling')
})

test('localDateInput uses local calendar date', () => {
  assert.equal(localDateInput(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
})
