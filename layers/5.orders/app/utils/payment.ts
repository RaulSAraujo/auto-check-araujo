import type { FormaPagamento } from '~~/shared/types/oficina'

export type FinanceSummary = {
  total_faturado: number
  total_pago: number
  total_pendente: number
  qtd_os: number
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

export interface PaymentFormState {
  pago: boolean
  forma_pagamento: FormaPagamento | undefined
}

export function emptyPaymentForm(): PaymentFormState {
  return {
    pago: false,
    forma_pagamento: undefined
  }
}

export function paymentFormFromOrder(order: {
  pago: boolean
  forma_pagamento: string | null
}): PaymentFormState {
  return {
    pago: order.pago,
    forma_pagamento: (order.forma_pagamento as FormaPagamento | null) || undefined
  }
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
