import assert from 'node:assert/strict'
import test from 'node:test'
import { creditInstallmentFee, suggestChargeAmount } from './pricing.ts'

test('adds the configured fee for each credit installment after the first', () => {
  const fee = creditInstallmentFee(3.5, 1.08, 6)
  const charged = suggestChargeAmount(1000, 'cartao_credito', { debito: 1.5, credito: fee })

  assert.equal(fee, 8.9)
  assert.equal(charged, 1097.69)
})

test('keeps the existing credit rate for payment in one installment', () => {
  assert.equal(creditInstallmentFee(3.5, 1.08, 1), 3.5)
})
