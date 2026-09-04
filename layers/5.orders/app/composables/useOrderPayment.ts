import type { OrderDetail } from '../types/orders'
import type { PaymentFormState } from '../utils/payment'
import { emptyPaymentForm, paymentFormFromOrder } from '../utils/payment'

export function useOrderPayment(
  orderId: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  refresh: () => Promise<void>
) {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()
  const { can } = usePermissions()

  const state = reactive<PaymentFormState>(emptyPaymentForm())
  const saving = ref(false)

  const canEditPayment = computed(() => {
    if (!can('orders.edit')) return false
    if (!ordem.value) return false
    return ordem.value.status === 'concluida' && ordem.value.valor_total != null
  })

  const showPaymentSection = computed(() => {
    if (!ordem.value) return false
    return ordem.value.status === 'concluida' || ordem.value.valor_total != null
  })

  const baseline = reactive<PaymentFormState>(emptyPaymentForm())

  const isDirty = computed(() => {
    if (!canEditPayment.value) return false
    return state.pago !== baseline.pago
      || state.forma_pagamento !== baseline.forma_pagamento
  })

  function syncFromOrder(value: OrderDetail) {
    const next = paymentFormFromOrder(value)
    Object.assign(baseline, next)
    Object.assign(state, next)
  }

  function discard() {
    if (!ordem.value) return
    syncFromOrder(ordem.value)
  }

  watch(ordem, (value) => {
    if (!value) return
    syncFromOrder(value)
  }, { immediate: true })

  async function savePayment(): Promise<boolean> {
    if (!ordem.value || !canEditPayment.value) return true
    if (!isDirty.value) return true

    if (state.pago && !state.forma_pagamento) {
      toast.add({ title: 'Selecione a forma de pagamento', color: 'warning' })
      return false
    }

    saving.value = true
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          pago: state.pago,
          pago_em: state.pago ? new Date().toISOString() : null,
          forma_pagamento: state.pago ? state.forma_pagamento : null
        })
        .eq('id', toValue(orderId))

      if (error) {
        toast.add({ title: 'Erro ao salvar pagamento', description: error.message, color: 'error' })
        return false
      }

      toast.add({
        title: state.pago ? 'Pagamento registrado' : 'Pagamento removido',
        color: 'success'
      })
      await refresh()
      return true
    } finally {
      saving.value = false
    }
  }

  return {
    state,
    saving,
    canEditPayment,
    showPaymentSection,
    isDirty,
    discard,
    savePayment
  }
}
