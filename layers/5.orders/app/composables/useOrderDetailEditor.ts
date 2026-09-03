import type { OrderDetail } from '../types/orders'
import type { OrderEditState } from '../utils/order-form'
import {
  emptyOrderEditForm,
  isOrderEditDirty,
  orderEditFromRow,
  validateOrderEditForm
} from '../utils/order-form'
import { isOrderEditable, type OrdemStatus } from '~~/shared/types/oficina'

export function useOrderDetailEditor(
  id: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  state: OrderEditState,
  refresh: () => Promise<void>
) {
  const { updateOrder } = useOrderMutations()
  const { can } = usePermissions()

  const saving = ref(false)
  const baseline = reactive(emptyOrderEditForm())

  const canEdit = computed(() => {
    if (!can('orders.edit')) return false
    if (!ordem.value) return false
    return isOrderEditable(ordem.value.status as OrdemStatus)
  })

  const isDirty = computed(() => canEdit.value && isOrderEditDirty(state, baseline))

  function syncFromOrder(value: OrderDetail) {
    const next = orderEditFromRow(value)
    Object.assign(baseline, next)
    Object.assign(state, next)
  }

  function discard() {
    if (ordem.value) syncFromOrder(ordem.value)
  }

  async function save() {
    if (!canEdit.value) return

    const errors = validateOrderEditForm(state)
    if (errors.length) return

    saving.value = true
    try {
      const { error } = await updateOrder(toValue(id), state)
      if (!error) {
        await refresh()
        if (ordem.value) syncFromOrder(ordem.value)
      }
    } finally {
      saving.value = false
    }
  }

  watch(ordem, (value) => {
    if (!value) return
    syncFromOrder(value)
  }, { immediate: true })

  return {
    saving,
    canEdit,
    isDirty,
    discard,
    save
  }
}
