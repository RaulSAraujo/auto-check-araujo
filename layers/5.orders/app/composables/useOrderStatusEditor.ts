import type { OrderDetail } from '../types/orders'
import type { OrdemStatus } from '~~/shared/types/oficina'
import { canConcludeOrder } from '~~/shared/types/oficina'
import { ORDEM_STATUS_SELECT_ITEMS } from '../utils/order-select-items'

export function useOrderStatusEditor(
  id: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  refresh: () => Promise<void>
) {
  const { updateOrderStatus } = useOrderMutations()
  const { canChangeOrderStatus } = usePermissions()
  const toast = useToast()

  const selectedStatus = ref('')
  const savingStatus = ref(false)
  const concludeOpen = ref(false)

  let concludeResolver: ((confirmed: boolean) => void) | null = null

  const statusItems = computed(() => {
    if (!ordem.value) return [...ORDEM_STATUS_SELECT_ITEMS]

    const current = ordem.value.status as OrdemStatus
    return ORDEM_STATUS_SELECT_ITEMS.filter(item =>
      canChangeOrderStatus(current, item.value as OrdemStatus)
    )
  })

  const isDirty = computed(() => {
    if (!ordem.value) return false
    return selectedStatus.value !== ordem.value.status
  })

  watch(ordem, (value) => {
    if (value) selectedStatus.value = value.status
  }, { immediate: true })

  watch(concludeOpen, (open) => {
    if (!open && concludeResolver) {
      concludeResolver(false)
      concludeResolver = null
    }
  })

  function discard() {
    if (!ordem.value) return
    selectedStatus.value = ordem.value.status
  }

  function requestConcludeConfirm(): Promise<boolean> {
    concludeOpen.value = true
    return new Promise((resolve) => {
      concludeResolver = resolve
    })
  }

  function resolveConclude(confirmed: boolean) {
    const resolver = concludeResolver
    concludeResolver = null
    concludeOpen.value = false
    resolver?.(confirmed)
  }

  async function saveStatus(): Promise<boolean> {
    if (!ordem.value || selectedStatus.value === ordem.value.status) return true

    const current = ordem.value.status as OrdemStatus
    const next = selectedStatus.value as OrdemStatus
    if (!canChangeOrderStatus(current, next)) {
      selectedStatus.value = ordem.value.status
      return false
    }

    if (next === 'concluida') {
      if (!canConcludeOrder(ordem.value)) {
        const total = Number(ordem.value.valor_total) || 0
        toast.add({
          title: total > 0 && ordem.value.orcamento_status === 'aprovado'
            ? 'Pagamento necessário'
            : 'Orçamento necessário',
          description: total > 0 && ordem.value.orcamento_status === 'aprovado'
            ? 'Registre o pagamento antes de concluir a OS.'
            : 'Aprove o orçamento antes de concluir a OS.',
          color: 'warning'
        })
        selectedStatus.value = ordem.value.status
        return false
      }

      const confirmed = await requestConcludeConfirm()
      if (!confirmed) return false
    }

    savingStatus.value = true
    try {
      const { error } = await updateOrderStatus(
        toValue(id),
        ordem.value.status,
        selectedStatus.value
      )

      if (error) {
        selectedStatus.value = ordem.value.status
        return false
      }

      await refresh()
      return true
    } finally {
      savingStatus.value = false
    }
  }

  return {
    selectedStatus,
    savingStatus,
    statusItems,
    isDirty,
    concludeOpen,
    discard,
    resolveConclude,
    saveStatus
  }
}
