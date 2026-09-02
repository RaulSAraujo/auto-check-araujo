import type { FormaPagamento } from '~~/shared/types/oficina'

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
