import type { CustomerFormState } from '../utils/customer-form'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

export function useCustomerDetailPage(
  id: MaybeRefOrGetter<string>,
  cliente: Ref<Awaited<ReturnType<typeof useCustomerQuery>>['data']['value']>,
  veiculos: Ref<Awaited<ReturnType<typeof useCustomerVehicles>>['data']['value']>,
  state: CustomerFormState,
  refresh: () => Promise<void>
) {
  const router = useRouter()
  const { updateCustomer, deleteCustomer } = useCustomerMutations()

  const editing = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const deleteOpen = ref(false)

  function cancelEdit() {
    editing.value = false
    refresh()
  }

  async function save() {
    saving.value = true
    try {
      const { error } = await updateCustomer(toValue(id), state)
      if (!error) {
        editing.value = false
        await refresh()
      }
    } finally {
      saving.value = false
    }
  }

  async function removeCustomer() {
    deleting.value = true
    try {
      const { error, blocked } = await deleteCustomer(
        toValue(id),
        veiculos.value?.length || 0
      )
      if (blocked) {
        deleteOpen.value = false
        return
      }
      if (!error) {
        await router.push(CUSTOMER_ROUTES.list)
      }
    } finally {
      deleting.value = false
      deleteOpen.value = false
    }
  }

  return {
    editing,
    saving,
    deleting,
    deleteOpen,
    cancelEdit,
    save,
    removeCustomer
  }
}
