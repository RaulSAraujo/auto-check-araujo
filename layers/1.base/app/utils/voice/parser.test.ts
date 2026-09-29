import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVoiceCommand } from './parser.ts'

// Terça-feira, 29/09/2026 10:00 (hora local)
const NOW = new Date(2026, 8, 29, 10, 0)
const parse = (text: string) => parseVoiceCommand(text, NOW)

test('returns null for unrelated or empty speech', () => {
  assert.equal(parse('bom dia tudo bem'), null)
  assert.equal(parse(''), null)
  assert.equal(parse('   '), null)
})

test('customer.create', () => {
  assert.deepEqual(parse('Novo cliente João da Silva telefone 11 98888-7777 email joao arroba gmail ponto com cpf 123.456.789-09.'), {
    intent: 'customer.create',
    payload: { nome: 'João da Silva', telefones: ['11988887777'], emails: ['joao@gmail.com'], documento: '12345678909' }
  })
  assert.deepEqual(parse('novo cliente'), { intent: 'customer.create', payload: {} })
  assert.deepEqual(parse('cadastrar cliente Ana celular 11 91111 2222 whatsapp 11 93333 4444 observação prefere manhã'), {
    intent: 'customer.create',
    payload: { nome: 'Ana', telefones: ['11911112222', '11933334444'], observacoes: 'prefere manhã' }
  })
})

test('vehicle.create', () => {
  assert.deepEqual(parse('novo veículo placa ABC1D23 marca Fiat modelo Uno ano 2015 cor prata km 45 mil cliente Maria Souza'), {
    intent: 'vehicle.create',
    payload: { placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', ano: 2015, cor: 'prata', km_atual: 45000, clienteNome: 'Maria Souza' }
  })
  assert.deepEqual(parse('novo carro placa abc 1234 dono José'), {
    intent: 'vehicle.create',
    payload: { placa: 'ABC1234', clienteNome: 'José' }
  })
})

test('order.create', () => {
  assert.deepEqual(parse('nova OS placa abc 1 d 23 km 45000 reclamação barulho no freio'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23', km_entrada: 45000, reclamacao: 'barulho no freio' }
  })
  assert.deepEqual(parse('abrir ordem de serviço placa ABC1D23 problema motor falhando diagnóstico vela observação cliente aguarda'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23', reclamacao: 'motor falhando', diagnostico: 'vela', observacoes: 'cliente aguarda' }
  })
})

test('appointment.create', () => {
  assert.deepEqual(parse('agendar placa ABC1D23 amanhã às 14h problema revisão'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-09-30', startTime: '14:00', problema: 'revisão' }
  })
  assert.deepEqual(parse('novo agendamento placa ABC1D23 sexta às 2 da tarde'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '14:00' }
  })
  assert.deepEqual(parse('marcar placa ABC1D23 dia 5 de outubro às 9 e meia serviço troca de óleo'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-10-05', startTime: '09:30', problema: 'troca de óleo' }
  })
})

test('appointment.create ignores spelled plate tokens when reading time', () => {
  const expected = (placa: string) => ({ intent: 'appointment.create', payload: { placa, date: '2026-09-30', startTime: '14:00' } })
  assert.deepEqual(parse('agendar placa a bê cê um e dois três amanhã às 14h'), expected('ABC1E23'))
  assert.deepEqual(parse('agendar placa abc 1 e 23 amanhã às 14h'), expected('ABC1E23'))
  assert.deepEqual(parse('agendar placa a b a 1 2 3 4 amanhã às 14h'), expected('ABA1234'))
})

test('budgetItem.create', () => {
  assert.deepEqual(parse('adicionar peça pastilha de freio quantidade 2 valor 150 reais'), {
    intent: 'budgetItem.create',
    payload: { tipo: 'peca', descricao: 'pastilha de freio', quantidade: 2, valor_unitario: 150 }
  })
  assert.deepEqual(parse('incluir serviço alinhamento valor 80 reais e 50 centavos'), {
    intent: 'budgetItem.create',
    payload: { tipo: 'servico', descricao: 'alinhamento', valor_unitario: 80.5 }
  })
  assert.deepEqual(parse('adicionar kit'), { intent: 'budgetItem.create', payload: { tipo: 'kit' } })
  assert.deepEqual(parse('adicionar item lavagem'), { intent: 'budgetItem.create', payload: { tipo: 'servico', descricao: 'lavagem' } })
})

test('account.create', () => {
  assert.deepEqual(parse('nova conta energia elétrica valor 350 reais vencimento dia 10 categoria luz fornecedor Enel'), {
    intent: 'account.create',
    payload: { descricao: 'energia elétrica', valor: 350, vencimento: '2026-10-10', categoriaNome: 'luz', fornecedorNome: 'Enel' }
  })
  assert.deepEqual(parse('nova conta a pagar aluguel valor 2 mil vence dia 5 de outubro'), {
    intent: 'account.create',
    payload: { descricao: 'aluguel', valor: 2000, vencimento: '2026-10-05' }
  })
})

test('catalogItem.create', () => {
  assert.deepEqual(parse('novo serviço alinhamento valor 80 reais horas 1'), {
    intent: 'catalogItem.create',
    payload: { tipo: 'servico', nome: 'alinhamento', valor_padrao: 80, horas_estimadas: 1 }
  })
  assert.deepEqual(parse('nova peça filtro de óleo custo 20 valor 45 estoque 10'), {
    intent: 'catalogItem.create',
    payload: { tipo: 'peca', nome: 'filtro de óleo', custo: 20, valor_padrao: 45, estoque: 10 }
  })
})

test('supplier.create', () => {
  assert.deepEqual(parse('novo fornecedor Auto Peças Silva telefone 11 3333 4444 email vendas arroba silva ponto com'), {
    intent: 'supplier.create',
    payload: { nome: 'Auto Peças Silva', telefone: '1133334444', email: 'vendas@silva.com' }
  })
})

test('collaborator.create never includes a password', () => {
  assert.deepEqual(parse('novo colaborador Pedro Santos usuário pedro papel mecânico'), {
    intent: 'collaborator.create',
    payload: { nome: 'Pedro Santos', username: 'pedro', papel: 'mecanico' }
  })
  assert.deepEqual(parse('nova funcionária Ana Lima cargo recepcionista'), {
    intent: 'collaborator.create',
    payload: { nome: 'Ana Lima', papel: 'recepcao' }
  })
  assert.deepEqual(parse('novo colaborador Pedro senha 1234'), {
    intent: 'collaborator.create',
    payload: { nome: 'Pedro' }
  })
  assert.deepEqual(parse('novo colaborador Pedro usuário pedro senha 1234'), {
    intent: 'collaborator.create',
    payload: { nome: 'Pedro', username: 'pedro' }
  })
})

test('trigger disambiguation', () => {
  assert.equal(parse('adicionar serviço troca de óleo')?.intent, 'budgetItem.create')
  assert.equal(parse('cadastrar serviço troca de óleo')?.intent, 'catalogItem.create')
  assert.equal(parse('novo veículo placa ABC1D23 cliente Maria')?.intent, 'vehicle.create')
  assert.equal(parse('nova ordem de serviço placa ABC1D23')?.intent, 'order.create')
})

test('leading filler before the trigger is ignored', () => {
  assert.deepEqual(parse('por favor novo cliente Carlos'), { intent: 'customer.create', payload: { nome: 'Carlos' } })
})

test('plate spelled letter by letter', () => {
  assert.deepEqual(parse('nova os placa a bê cê um dê dois três'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23' }
  })
})
