import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeVoiceCommand } from './normalize.ts'

test('rejects unknown, null and malformed input', () => {
  assert.equal(normalizeVoiceCommand(null), null)
  assert.equal(normalizeVoiceCommand('x'), null)
  assert.equal(normalizeVoiceCommand({ intent: null, payload: {} }), null)
  assert.equal(normalizeVoiceCommand({ intent: 'drop.table', payload: {} }), null)
  assert.equal(normalizeVoiceCommand({ intent: 'navigate', payload: { to: 'hack' } }), null)
  assert.equal(normalizeVoiceCommand({ intent: '__proto__', payload: {} }), null)
  assert.equal(normalizeVoiceCommand({ intent: 'constructor', payload: {} }), null)
})

test('blank strings are absent, not zero', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'order.edit',
    payload: { km_entrada: '', diagnostico: 'ok' }
  }), { intent: 'order.edit', payload: { diagnostico: 'ok' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'account.create',
    payload: { descricao: 'Energia', valor: ' ' }
  }), { intent: 'account.create', payload: { descricao: 'Energia' } })
})

test('numbers accept Brazilian thousands separators', () => {
  const valor = (v: string) => normalizeVoiceCommand({ intent: 'account.create', payload: { valor: v } })?.payload
  assert.deepEqual(valor('1.500'), { valor: 1500 })
  assert.deepEqual(valor('1.500,50'), { valor: 1500.5 })
  assert.deepEqual(valor('150.5'), { valor: 150.5 })
})

test('vehicle.edit and appointment.noShow', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'vehicle.edit',
    payload: { target: { placa: 'abc 1d23' }, km_atual: '52000', cor: ' prata ' }
  }), { intent: 'vehicle.edit', payload: { target: { placa: 'ABC1D23' }, km_atual: 52000, cor: 'prata' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.noShow',
    payload: { placa: 'ABC-1D23', motivo: 'x' }
  }), { intent: 'appointment.noShow', payload: { placa: 'ABC1D23' } })
})

test('order.edit keeps only valid fields', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'order.edit',
    payload: {
      target: { placa: 'abc-1d23', numero: 'OS 0012', lixo: 1 },
      km_entrada: '45000',
      diagnostico: '  pastilha gasta ',
      reclamacao: '',
      status: 'em_andamento',
      itens: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150.5 }, { tipo: 'x' }],
      senha: '123'
    }
  }), {
    intent: 'order.edit',
    payload: {
      target: { placa: 'ABC1D23', numero: '12' },
      km_entrada: 45000,
      diagnostico: 'pastilha gasta',
      status: 'em_andamento',
      itens: [
        { tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150.5 }
      ]
    }
  })
})

test('order.edit drops invalid status, plate and empty target', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'order.edit',
    payload: { target: { placa: 'XYZ' }, status: 'voando', km_entrada: -3 }
  }), { intent: 'order.edit', payload: {} })
})

test('customer.edit normalizes contacts', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'customer.edit',
    payload: { target: { nome: 'João' }, telefones: '(11) 98888-7777', emails: ['JOAO@Gmail.com', 'ruim'], documento: '123.456.789-09' }
  }), {
    intent: 'customer.edit',
    payload: { target: { nome: 'João' }, telefones: ['11988887777'], emails: ['joao@gmail.com'], documento: '12345678909' }
  })
})

test('appointment and navigate validate date and time', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.reschedule',
    payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '9:30' }
  }), { intent: 'appointment.reschedule', payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '09:30' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-02-30', startTime: '25:00', problema: 'revisão' }
  }), { intent: 'appointment.create', payload: { placa: 'ABC1D23', problema: 'revisão' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'navigate',
    payload: { to: 'scheduling', date: '2026-09-30' }
  }), { intent: 'navigate', payload: { to: 'scheduling', date: '2026-09-30' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'navigate',
    payload: { to: 'orders', date: '2026-09-30' }
  }), { intent: 'navigate', payload: { to: 'orders' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.reschedule',
    payload: { startTime: '14:00:00' }
  }), { intent: 'appointment.reschedule', payload: { startTime: '14:00' } })
})

test('collaborator.create never carries a password', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'collaborator.create',
    payload: { nome: 'Pedro', username: 'Pedro', papel: 'mecanico', senha: '1234', password: 'x' }
  }), { intent: 'collaborator.create', payload: { nome: 'Pedro', username: 'pedro', papel: 'mecanico' } })
})

test('create intents map money and numbers', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'account.create',
    payload: { descricao: 'Energia', valor: '350,90', vencimento: '2026-10-10', categoriaNome: 'Luz' }
  }), { intent: 'account.create', payload: { descricao: 'Energia', valor: 350.9, vencimento: '2026-10-10', categoriaNome: 'Luz' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'catalogItem.create',
    payload: { nome: 'Alinhamento', valor_padrao: 80 }
  }), { intent: 'catalogItem.create', payload: { tipo: 'servico', nome: 'Alinhamento', valor_padrao: 80 } })
})
