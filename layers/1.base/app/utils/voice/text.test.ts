import assert from 'node:assert/strict'
import test from 'node:test'
import {
  foldText,
  joinRaw,
  parseDate,
  parseDigits,
  parseEmail,
  parseMoney,
  parseNumber,
  parsePlaca,
  parseTime,
  tokenize
} from './text.ts'

// Terça-feira, 29/09/2026 10:00 (hora local)
const NOW = new Date(2026, 8, 29, 10, 0)
const t = (text: string) => tokenize(text)

test('foldText lowercases and strips accents', () => {
  assert.equal(foldText('Veículo ÁGUA Três'), 'veiculo agua tres')
})

test('tokenize keeps raw text and strips edge punctuation', () => {
  assert.deepEqual(tokenize('Novo cliente, João.'), [
    { raw: 'Novo', folded: 'novo' },
    { raw: 'cliente', folded: 'cliente' },
    { raw: 'João', folded: 'joao' }
  ])
  assert.deepEqual(tokenize('R$ 1.500,50 às 14:30!').map(token => token.raw), ['R$', '1.500,50', 'às', '14:30'])
  assert.deepEqual(tokenize('   '), [])
})

test('joinRaw rebuilds the original words', () => {
  assert.equal(joinRaw(t('pastilha  de freio')), 'pastilha de freio')
  assert.equal(joinRaw([]), '')
})

test('parseNumber reads digits and pt-BR number words', () => {
  assert.equal(parseNumber(t('45000')), 45000)
  assert.equal(parseNumber(t('45.000')), 45000)
  assert.equal(parseNumber(t('45 mil')), 45000)
  assert.equal(parseNumber(t('cento e cinquenta')), 150)
  assert.equal(parseNumber(t('dois mil e quinze')), 2015)
  assert.equal(parseNumber(t('duas')), 2)
  assert.equal(parseNumber(t('1,5')), 1.5)
  assert.equal(parseNumber(t('de 10 unidades')), 10)
  assert.equal(parseNumber(t('nada')), undefined)
})

test('parseMoney reads reais and centavos', () => {
  assert.equal(parseMoney(t('150 reais')), 150)
  assert.equal(parseMoney(t('R$ 1.500,50')), 1500.5)
  assert.equal(parseMoney(t('80 reais e 50 centavos')), 80.5)
  assert.equal(parseMoney(t('cento e vinte reais')), 120)
  assert.equal(parseMoney(t('de 99,90')), 99.9)
  assert.equal(parseMoney(t('2 mil')), 2000)
  assert.equal(parseMoney(t('grátis')), undefined)
})

test('parsePlaca joins spoken plate pieces', () => {
  assert.equal(parsePlaca(t('ABC1D23')), 'ABC1D23')
  assert.equal(parsePlaca(t('abc-1234')), 'ABC1234')
  assert.equal(parsePlaca(t('abc 1 d 23 amanhã')), 'ABC1D23')
  assert.equal(parsePlaca(t('a bê cê um dê dois três')), 'ABC1D23')
  assert.equal(parsePlaca(t('xyz')), undefined)
  assert.equal(parsePlaca(t('1234567')), undefined)
})

test('parseDigits collects a phone or document number', () => {
  assert.equal(parseDigits(t('11 98888-7777')), '11988887777')
  assert.equal(parseDigits(t('é 11 3333 4444 obrigado')), '1133334444')
  assert.equal(parseDigits(t('um um nove meia')), '1196')
  assert.equal(parseDigits(t('123.456.789-09')), '12345678909')
  assert.equal(parseDigits(t('sem número')), '')
})

test('parseEmail understands arroba and ponto', () => {
  assert.equal(parseEmail(t('joao arroba gmail ponto com')), 'joao@gmail.com')
  assert.equal(parseEmail(t('Maria.Silva@Empresa.com.br')), 'maria.silva@empresa.com.br')
  assert.equal(parseEmail(t('joao underline silva arroba uol ponto com ponto br')), 'joao_silva@uol.com.br')
  assert.equal(parseEmail(t('joao gmail')), undefined)
})

test('parseDate finds relative and absolute dates', () => {
  assert.equal(parseDate(t('hoje'), NOW), '2026-09-29')
  assert.equal(parseDate(t('amanhã às 14h'), NOW), '2026-09-30')
  assert.equal(parseDate(t('depois de amanhã'), NOW), '2026-10-01')
  assert.equal(parseDate(t('sexta-feira'), NOW), '2026-10-02')
  assert.equal(parseDate(t('na terça'), NOW), '2026-10-06')
  assert.equal(parseDate(t('domingo'), NOW), '2026-10-04')
  assert.equal(parseDate(t('dia 10'), NOW), '2026-10-10')
  assert.equal(parseDate(t('dia 30'), NOW), '2026-09-30')
  assert.equal(parseDate(t('dia dez'), NOW), '2026-10-10')
  assert.equal(parseDate(t('dia 5 de outubro'), NOW), '2026-10-05')
  assert.equal(parseDate(t('5 de outubro'), NOW), '2026-10-05')
  assert.equal(parseDate(t('dia 3 de janeiro'), NOW), '2027-01-03')
  assert.equal(parseDate(t('10/10'), NOW), '2026-10-10')
  assert.equal(parseDate(t('15/01/2027'), NOW), '2027-01-15')
  assert.equal(parseDate(t('sem data'), NOW), undefined)
})

test('parseTime finds spoken times', () => {
  assert.equal(parseTime(t('às 14h')), '14:00')
  assert.equal(parseTime(t('14h30')), '14:30')
  assert.equal(parseTime(t('14:30')), '14:30')
  assert.equal(parseTime(t('14 horas')), '14:00')
  assert.equal(parseTime(t('às 9 e meia')), '09:30')
  assert.equal(parseTime(t('2 da tarde')), '14:00')
  assert.equal(parseTime(t('8 da noite')), '20:00')
  assert.equal(parseTime(t('9 da manhã')), '09:00')
  assert.equal(parseTime(t('meio-dia')), '12:00')
  assert.equal(parseTime(t('meio dia e meia')), '12:30')
  assert.equal(parseTime(t('às duas e quinze da tarde')), '14:15')
  assert.equal(parseTime(t('dia 5 de outubro às 9 e meia')), '09:30')
  assert.equal(parseTime(t('dia 10')), undefined)
})
