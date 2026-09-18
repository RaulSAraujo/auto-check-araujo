import type { OrderDetail } from '../types/orders'
import type { PaymentFormState } from '../utils/payment'
import {
  defaultChargeForForma,
  emptyPaymentForm,
  paymentFormFromOrder
} from '../utils/payment'
import { isOrderEditable, type OrdemStatus } from '~~/shared/types/oficina'
import {
  creditInstallmentFee,
  pricingDraftFromRow,
  type PricingParamsRow
} from '#layers/configuration/app/utils/pricing'

export function useOrderPayment(
  orderId: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  refresh: () => Promise<void>
) {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()
  const { can } = usePermissions()
  const { params } = usePricingParams()

  const state = reactive<PaymentFormState>(emptyPaymentForm())
  const saving = ref(false)
  const chargeTouched = ref(false)

  const canEditPayment = computed(() => {
    if (!can('orders.edit')) return false
    if (!ordem.value) return false
    // Pagamento precisa ser registrável antes da conclusão (exceto OS já fechada).
    return isOrderEditable(ordem.value.status as OrdemStatus)
      || ordem.value.status === 'concluida'
  })

  const showPaymentSection = computed(() => {
    if (!ordem.value) return false
    return ordem.value.orcamento_status === 'aprovado'
      || ordem.value.status === 'concluida'
      || Number(ordem.value.valor_total) > 0
  })

  const cardFees = computed(() => {
    const row = params.value as PricingParamsRow | null
    if (!row) return { debito: 0, credito: 0 }
    const draft = pricingDraftFromRow(row)
    return {
      debito: draft.taxa_cartao_debito,
      credito: creditInstallmentFee(
        draft.taxa_cartao_credito,
        draft.acrescimo_cartao_credito_parcela,
        state.parcelas ?? 1
      )
    }
  })

  const budgetTotal = computed(() => Number(ordem.value?.valor_total) || 0)

  const suggestedCharge = computed(() =>
    defaultChargeForForma(budgetTotal.value, state.forma_pagamento, cardFees.value)
  )
  const suggestedFee = computed(() => {
    if (state.forma_pagamento === 'cartao_debito') return cardFees.value.debito
    if (state.forma_pagamento === 'cartao_credito') return cardFees.value.credito
    return null
  })

  const baseline = reactive<PaymentFormState>(emptyPaymentForm())
  // Skip side-effect watchers while hydrating from the order (otherwise
  // forma/parcelas watchers overwrite valor_cobrado with the fee suggestion
  // and mark a paid OS dirty on every visit).
  let syncing = false

  const isDirty = computed(() => {
    if (!canEditPayment.value) return false
    return state.pago !== baseline.pago
      || state.forma_pagamento !== baseline.forma_pagamento
      || state.parcelas !== baseline.parcelas
      || Number(state.valor_cobrado ?? 0) !== Number(baseline.valor_cobrado ?? 0)
  })

  function syncFromOrder(value: OrderDetail) {
    const next = paymentFormFromOrder(value)
    syncing = true
    Object.assign(baseline, next)
    Object.assign(state, next)
    chargeTouched.value = false
    nextTick(() => {
      syncing = false
    })
  }

  function discard() {
    if (!ordem.value) return
    syncFromOrder(ordem.value)
  }

  function applySuggestedCharge() {
    state.valor_cobrado = suggestedCharge.value
    chargeTouched.value = false
  }

  function markChargeTouched() {
    chargeTouched.value = true
  }

  watch(ordem, (value) => {
    if (!value) return
    syncFromOrder(value)
  }, { immediate: true })

  watch(() => state.pago, (pago) => {
    if (syncing) return
    if (!pago) {
      state.forma_pagamento = undefined
      state.parcelas = null
      state.valor_cobrado = null
      chargeTouched.value = false
      return
    }
    if (state.valor_cobrado == null) {
      state.valor_cobrado = budgetTotal.value
    }
  })

  watch(() => state.forma_pagamento, (forma) => {
    if (syncing || !state.pago || !forma) return
    state.parcelas = forma === 'cartao_credito' ? (state.parcelas ?? 1) : null
    if (chargeTouched.value) return
    state.valor_cobrado = defaultChargeForForma(budgetTotal.value, forma, cardFees.value)
  })

  watch(() => state.parcelas, () => {
    if (syncing) return
    if (!state.pago || state.forma_pagamento !== 'cartao_credito' || chargeTouched.value) return
    state.valor_cobrado = defaultChargeForForma(budgetTotal.value, state.forma_pagamento, cardFees.value)
  })

  async function savePayment(): Promise<boolean> {
    if (!ordem.value || !canEditPayment.value) return true
    if (!isDirty.value) return true

    if (state.pago && !state.forma_pagamento) {
      toast.add({ title: 'Selecione a forma de pagamento', color: 'warning' })
      return false
    }

    if (state.pago && (state.valor_cobrado == null || state.valor_cobrado < 0)) {
      toast.add({ title: 'Informe o valor cobrado', color: 'warning' })
      return false
    }

    saving.value = true
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          pago: state.pago,
          pago_em: state.pago ? new Date().toISOString() : null,
          forma_pagamento: state.pago ? state.forma_pagamento : null,
          parcelas: state.pago ? state.parcelas : null,
          valor_cobrado: state.pago ? state.valor_cobrado : null
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
    suggestedCharge,
    suggestedFee,
    applySuggestedCharge,
    markChargeTouched,
    discard,
    savePayment
  }
}
