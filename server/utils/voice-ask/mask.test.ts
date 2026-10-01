import assert from 'node:assert/strict'
import test from 'node:test'
import { createMasker } from './mask.ts'

test('masks contact fields in tool results and keeps ids', () => {
  const m = createMasker()
  const masked = m.maskResult({
    id: '11988887777',
    cliente_id: 'abc',
    nome: 'João',
    telefones: ['(11) 98888-7777'],
    emails: ['Joao@Mail.com'],
    documento: '123.456.789-00',
    observacoes: 'ligar no 11 97777-6666'
  })
  assert.deepEqual(masked, {
    id: '11988887777',
    cliente_id: 'abc',
    nome: 'João',
    telefones: ['[telefone 1]'],
    emails: ['[email 2]'],
    documento: '[documento 3]',
    observacoes: 'ligar no [telefone 4]'
  })
})

test('masks patterns in user text; same value gives the same token', () => {
  const m = createMasker()
  assert.equal(m.maskText('de quem é o 11988887777?'), 'de quem é o [telefone 1]?')
  assert.equal((m.maskResult({ telefones: ['(11) 98888-7777'] }) as { telefones: string[] }).telefones[0], '[telefone 1]')
  assert.equal(m.maskText('cpf 123.456.789-00 e cnpj 12.345.678/0001-90'), 'cpf [documento 2] e cnpj [documento 3]')
  assert.equal(m.maskText('documento 12345678900'), 'documento [documento 2]')
  assert.equal(m.maskText('email joao@mail.com'), 'email [email 4]')
  assert.equal(m.maskText('OS 1234 de 2026-09-30, R$ 150'), 'OS 1234 de 2026-09-30, R$ 150')
})

test('masks the usual phone shapes; with or without +55 is the same phone', () => {
  const m = createMasker()
  assert.equal(m.maskText('+5511988887777'), '[telefone 1]')
  assert.equal(m.maskText('5511988887777'), '[telefone 1]')
  assert.equal(m.maskText('wa.me/5511988887777'), 'wa.me/[telefone 1]')
  assert.equal(m.maskText('(11) 9 8888-7777'), '[telefone 1]')
  assert.equal(m.maskText('11 9 8888 7777'), '[telefone 1]')
  assert.equal(m.maskText('11.98888.7777'), '[telefone 1]')
  assert.equal(m.maskText('(11) 98888-7777ramal'), '[telefone 1]ramal')
  assert.equal(m.maskText('fixo (11) 3333-4444'), 'fixo [telefone 2]')
})

test('masks partial CPF, CNPJ in free text and accented e-mails', () => {
  const m = createMasker()
  assert.equal(m.maskText('cpf 123456789-00'), 'cpf [documento 1]')
  assert.deepEqual(m.maskResult({ observacoes: 'faturar no CNPJ 12.345.678/0001-90' }), { observacoes: 'faturar no CNPJ [documento 2]' })
  assert.equal(m.maskText('joão@mail.com.br'), '[email 3]')
})

test('leaves order numbers, dates and uuids alone', () => {
  const m = createMasker()
  const text = 'OS-2026-0012 de 2026-09-30, ref 0f8fad5b-d9cb-469f-a165-70867728950e, R$ 1.250,00, ABC1D23'
  assert.equal(m.maskText(text), text)
})

test('documents without digits keep distinct tokens; numeric contact fields are masked', () => {
  const m = createMasker()
  assert.deepEqual(m.maskResult([{ documento: 'isento' }, { documento: 'N/A' }, { telefone: 11988887777 }]), [
    { documento: '[documento 1]' },
    { documento: '[documento 2]' },
    { telefone: '[telefone 3]' }
  ])
})

test('unmasks the answer and tool arguments; unknown tokens stay as text', () => {
  const m = createMasker()
  m.maskResult({ telefones: ['(11) 98888-7777'] })
  assert.equal(m.unmask('O telefone é [telefone 1].'), 'O telefone é (11) 98888-7777.')
  assert.equal(m.unmask('Ver [telefone 9].'), 'Ver [telefone 9].')
  assert.deepEqual(m.unmaskArgs({ telefone: '[telefone 1]', limit: 3 }), { telefone: '(11) 98888-7777', limit: 3 })
})

test('new tokens start after the ones already in the history', () => {
  const m = createMasker(['O telefone é [telefone 2].', 'e o email?'])
  assert.equal(m.maskText('joao@mail.com'), '[email 3]')
})
