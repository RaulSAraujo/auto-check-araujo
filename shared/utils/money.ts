export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Digits typed as cents → "1.234,56" (no currency symbol). */
export function formatMoneyMask(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15)
  if (!cleaned) return ''
  const amount = Number(cleaned) / 100
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/** Masked "1.234,56" → number. Empty → undefined. */
export function parseMoneyMask(masked: string): number | undefined {
  const digits = masked.replace(/\D/g, '')
  if (!digits) return undefined
  return Number(digits) / 100
}

/** Numeric model → mask string for controlled inputs. */
export function moneyToMask(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// ponytail: assert-based self-check — fails loud if mask math drifts
if (import.meta.dev) {
  const roundTrip = parseMoneyMask(formatMoneyMask('123456'))
  if (roundTrip !== 1234.56) {
    console.error('[money] mask round-trip failed', roundTrip)
  }
}
