import type { OrderDetail } from '../types/orders'
import type { OrderEditState } from '../utils/order-form'
import { orderEditFromRow } from '../utils/order-form'
import { isOrderEditable, type OrdemStatus } from '~~/shared/types/oficina'

export function useOrderDetailEditor(
  id: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  state: OrderEditState,
  refresh: () => Promise<void>
) {
  const { updateOrder } = useOrderMutations()

  const editing = ref(false)
  const saving = ref(false)

  const canEdit = computed(() => {
    if (!ordem.value) return false
    return isOrderEditable(ordem.value.status as OrdemStatus)
  })

  function cancelEdit() {
    editing.value = false
    if (ordem.value) {
      Object.assign(state, orderEditFromRow(ordem.value))
    }
  }

  async function save() {
    saving.value = true
    try {
      const { error } = await updateOrder(toValue(id), state)
      if (!error) {
        editing.value = false
        await refresh()
      }
    } finally {
      saving.value = false
    }
  }

  watch(ordem, (value) => {
    if (!value || !isOrderEditable(value.status as OrdemStatus)) {
      editing.value = false
    }
  })

  return {
    editing,
    saving,
    canEdit,
    cancelEdit,
    save
  }
}
