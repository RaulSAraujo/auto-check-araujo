import assert from 'node:assert/strict'
import test from 'node:test'
import {
  sentenceCaseOrNull,
  titleCaseOrNull,
  toSentenceCase,
  toTitleCasePt
} from './text-case.ts'

test('title case keeps Portuguese particles lowercase', () => {
  assert.equal(toTitleCasePt('JOÃO DA SILVA'), 'João da Silva')
  assert.equal(toTitleCasePt('  maria   DOS  santos '), 'Maria dos Santos')
  assert.equal(toTitleCasePt('troca DE óleo'), 'Troca de Óleo')
})

test('title case capitalizes the first word even when it is a particle', () => {
  assert.equal(toTitleCasePt('DE OLIVEIRA'), 'De Oliveira')
})

test('sentence case lowercases the rest of the text', () => {
  assert.equal(toSentenceCase('TROCAR ÓLEO 5W30'), 'Trocar óleo 5w30')
  assert.equal(toSentenceCase('  barulho no motor  '), 'Barulho no motor')
})

test('null helpers return null for blank input', () => {
  assert.equal(titleCaseOrNull('   '), null)
  assert.equal(sentenceCaseOrNull(''), null)
  assert.equal(titleCaseOrNull(null), null)
})
