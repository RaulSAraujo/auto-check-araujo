import type { OrderDetail } from '../types/orders'
import { emptyOrderEditForm, orderEditFromRow, type OrderEditState } from '../utils/order-form'

export function useOrderEditForm(ordem?: Ref<OrderDetail | null | undefined>) {
  const state = reactive<OrderEditState>(emptyOrderEditForm())

  if (ordem) {
    watch(ordem, (value) => {
      if (!value) return
      Object.assign(state, orderEditFromRow(value))
    }, { immediate: true })
  }

  return { state }
}
