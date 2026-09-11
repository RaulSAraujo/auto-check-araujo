import type { FormaPagamento } from '~~/shared/types/oficina'
import { suggestChargeAmount } from '#layers/configuration/app/utils/pricing'

export interface PaymentFormState {
  pago: boolean
  forma_pagamento: FormaPagamento | undefined
  valor_cobrado: number | null
}

export function emptyPaymentForm(): PaymentFormState {
  return {
    pago: false,
    forma_pagamento: undefined,
    valor_cobrado: null
  }
}

export function paymentFormFromOrder(order: {
  pago: boolean
  forma_pagamento: string | null
  valor_cobrado: number | null
  valor_total: number | null
}): PaymentFormState {
  const forma = (order.forma_pagamento as FormaPagamento | null) || undefined
  const budget = Number(order.valor_total) || 0
  return {
    pago: order.pago,
    forma_pagamento: forma,
    valor_cobrado: order.pago
      ? (order.valor_cobrado == null ? budget : Number(order.valor_cobrado))
      : null
  }
}

export function defaultChargeForForma(
  budgetTotal: number,
  forma: FormaPagamento | undefined,
  fees: { debito: number, credito: number }
): number {
  return suggestChargeAmount(budgetTotal, forma, fees)
}
