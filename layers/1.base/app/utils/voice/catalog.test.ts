import assert from 'node:assert/strict'
import test from 'node:test'
import { VOICE_CATALOG, voiceConfirmText } from './catalog.ts'

const PERMISSIONS = [
  'customers.write', 'customers.delete', 'vehicles.write', 'vehicles.delete', 'orders.create', 'orders.edit',
  'budget.edit', 'budget.approve', 'finance.view', 'catalog.manage', 'scheduling.write', 'collaborators.manage'
]

test('every entity has pages, valid permissions and confirm texts', () => {
  for (const [key, entity] of Object.entries(VOICE_CATALOG)) {
    assert.ok(entity.pages.length, `${key}: pages`)
    for (const permission of Object.values(entity.permission)) assert.ok(PERMISSIONS.includes(permission!), `${key}: ${permission}`)
    for (const [name, action] of Object.entries(entity.actions)) {
      assert.ok(PERMISSIONS.includes(action.permission), `${key}.${name}: permission`)
      if (action.kind === 'confirm') assert.ok(action.confirm, `${key}.${name}: confirm text`)
    }
  }
})

test('no password-like key in fields, items, targets or args', () => {
  for (const [key, entity] of Object.entries(VOICE_CATALOG)) {
    const specs = [entity.fields, entity.items ?? {}, entity.target, ...Object.values(entity.actions).map(a => a.args ?? {})]
    for (const spec of specs) {
      for (const field of Object.keys(spec)) assert.doesNotMatch(field, /senha|password/i, `${key}.${field}`)
    }
  }
})

test('ref fields map to a state key', () => {
  for (const entity of Object.values(VOICE_CATALOG)) {
    for (const spec of [entity.fields, entity.items ?? {}]) {
      for (const [name, field] of Object.entries(spec)) {
        if (field.ref && field.ref !== 'catalogItem') assert.ok(field.stateKey, name)
      }
    }
  }
})

test('voiceConfirmText fills label and args with Portuguese labels', () => {
  assert.equal(voiceConfirmText('Marcar a conta {label} como paga ({forma})?', { label: 'Energia', forma: 'pix' }), 'Marcar a conta Energia como paga (Pix)?')
  assert.equal(voiceConfirmText('Mudar o papel de {label} para {papel}?', { label: 'Pedro', papel: 'mecanico' }), 'Mudar o papel de Pedro para mecânico?')
  assert.equal(voiceConfirmText('Remover "{descricao}"?', {}), 'Remover "…"?')
  assert.equal(voiceConfirmText('Desativar {label}?', { label: 'constructor' }), 'Desativar constructor?')
})
