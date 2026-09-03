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

  const statusItems = computed(() => {
    if (!ordem.value) return [...ORDEM_STATUS_SELECT_ITEMS]

    const current = ordem.value.status as OrdemStatus
    return ORDEM_STATUS_SELECT_ITEMS.filter(item =>
      canChangeOrderStatus(current, item.value as OrdemStatus)
    )
  })

  watch(ordem, (value) => {
    if (value) selectedStatus.value = value.status
  }, { immediate: true })

  async function saveStatus() {
    if (!ordem.value || selectedStatus.value === ordem.value.status) return

    const current = ordem.value.status as OrdemStatus
    const next = selectedStatus.value as OrdemStatus
    if (!canChangeOrderStatus(current, next)) {
      selectedStatus.value = ordem.value.status
      return
    }

    if (next === 'concluida') {
      if (!canConcludeOrder(ordem.value)) {
        toast.add({
          title: 'Orçamento necessário',
          description: 'Aprove o orçamento antes de concluir a OS.',
          color: 'warning'
        })
        selectedStatus.value = ordem.value.status
        return
      }

      const confirmed = window.confirm(
        'Concluir esta OS?\n\nApós concluir, não será possível alterar os dados nem o status.'
      )
      if (!confirmed) {
        selectedStatus.value = ordem.value.status
        return
      }
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
        return
      }

      await refresh()
    } finally {
      savingStatus.value = false
    }
  }

  return {
    selectedStatus,
    savingStatus,
    statusItems,
    saveStatus
  }
}
