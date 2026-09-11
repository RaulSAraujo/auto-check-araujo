export type FinanceSummary = {
  total_faturado: number
  total_pago: number
  total_pendente: number
  qtd_os: number
  total_a_pagar: number
  total_pago_despesas: number
  total_vencido: number
  entradas: number
  saidas: number
  saldo: number
}

export type FinanceOrderRow = {
  id: string
  numero: string
  concluida_em: string | null
  valor_total: number | null
  pago: boolean
  pago_em: string | null
  forma_pagamento: string | null
  veiculos: { placa: string } | null
}

export function currentMonthValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function monthValueToDate(monthValue: string): string {
  return `${monthValue}-01`
}

export function monthBounds(monthValue: string): { start: string, end: string } {
  const [yearStr, monthStr] = monthValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

const PT_MONTH_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
] as const

/** `YYYY-MM` → `set/26` (pt-BR). Avoids Postgres `MMM` = `MM` + literal `M`. */
export function formatCashFlowMonthLabel(mes: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(mes)
  if (!match) return mes
  const year = match[1]!
  const month = Number(match[2])
  if (month < 1 || month > 12) return mes
  return `${PT_MONTH_SHORT[month - 1]}/${year.slice(-2)}`
}

// ponytail: assert-based self-check — fails loud if month label drifts
if (import.meta.dev) {
  const sample = formatCashFlowMonthLabel('2026-09')
  if (sample !== 'set/26') {
    console.error('[finance] month label failed', sample)
  }
}
