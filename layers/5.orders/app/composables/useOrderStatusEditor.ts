import type { OrderDetail } from '../types/orders'
import { ORDEM_STATUS_SELECT_ITEMS } from '../utils/order-select-items'

export function useOrderStatusEditor(
  id: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  refresh: () => Promise<void>
) {
  const { updateOrderStatus } = useOrderMutations()

  const selectedStatus = ref('')
  const savingStatus = ref(false)

  watch(ordem, (value) => {
    if (value) selectedStatus.value = value.status
  }, { immediate: true })

  async function saveStatus() {
    if (!ordem.value || selectedStatus.value === ordem.value.status) return

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
    statusItems: ORDEM_STATUS_SELECT_ITEMS,
    saveStatus
  }
}
