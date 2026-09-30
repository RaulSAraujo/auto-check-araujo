import assert from 'node:assert/strict'
import test from 'node:test'
import { legacyToCommand } from './legacy.ts'
import { normalizeVoiceCommand } from './normalize.ts'
import { parseVoiceCommand } from './parser.ts'

const run = (text: string) => normalizeVoiceCommand(legacyToCommand(parseVoiceCommand(text, new Date(2026, 8, 30))))

test('v1 phrases become catalog commands', () => {
  assert.deepEqual(run('novo cliente João da Silva'), { op: 'create', entity: 'customer', fields: { nome: 'João da Silva' } })
  assert.equal(run('nova OS placa ABC1D23')?.fields?.veiculo, 'ABC1D23')
  assert.equal(run('nova OS placa ABC1D23')?.entity, 'order')
  assert.deepEqual(run('adicionar serviço troca de óleo')?.items, [{ tipo: 'servico', descricao: 'troca de óleo' }])
  assert.equal(run('adicionar serviço troca de óleo')?.op, 'edit')
  assert.equal(run('novo fornecedor Auto Peças')?.entity, 'supplier')
  assert.equal(run('bom dia'), null)
})

test('legacyToCommand maps renamed fields', () => {
  assert.deepEqual(legacyToCommand({ intent: 'vehicle.create', payload: { placa: 'ABC1D23', clienteNome: 'João' } }),
    { op: 'create', entity: 'vehicle', fields: { placa: 'ABC1D23', dono: 'João' } })
  assert.deepEqual(legacyToCommand({ intent: 'account.create', payload: { descricao: 'Luz', categoriaNome: 'Contas', fornecedorNome: 'Enel' } }),
    { op: 'create', entity: 'account', fields: { descricao: 'Luz', categoria: 'Contas', fornecedor: 'Enel' } })
  assert.equal(legacyToCommand(null), null)
})
