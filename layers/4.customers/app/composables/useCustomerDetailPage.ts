import type { CustomerFormState } from '../utils/customer-form'
import {
  customerFormFromRow,
  isCustomerFormDirty
} from '../utils/customer-form'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

export function useCustomerDetailPage(
  id: MaybeRefOrGetter<string>,
  cliente: Ref<Awaited<ReturnType<typeof useCustomerQuery>>['data']['value']>,
  veiculos: Ref<Awaited<ReturnType<typeof useCustomerVehicles>>['data']['value']>,
  state: CustomerFormState,
  refresh: () => Promise<void>
) {
  const router = useRouter()
  const { updateCustomer, setCustomerAtivo, deleteCustomer } = useCustomerMutations()

  const editing = ref(false)
  const saving = ref(false)
  const togglingAtivo = ref(false)
  const deleting = ref(false)
  const deleteOpen = ref(false)
  const discardOpen = ref(false)
  const leaveTo = ref<string | null>(null)
  const allowLeave = ref(false)

  const isDirty = computed(() => {
    if (!editing.value || !cliente.value) return false
    return isCustomerFormDirty(state, customerFormFromRow(cliente.value))
  })

  const discardTitle = computed(() =>
    leaveTo.value ? 'Sair sem salvar?' : 'Descartar alterações?'
  )

  const discardDescription = computed(() =>
    leaveTo.value
      ? 'Há alterações não salvas. Se sair agora, elas serão perdidas.'
      : 'O que você digitou não será salvo.'
  )

  function resetState() {
    if (!cliente.value) return
    Object.assign(state, customerFormFromRow(cliente.value))
  }

  function startEdit() {
    resetState()
    editing.value = true
  }

  function exitEdit() {
    editing.value = false
    resetState()
  }

  function cancelEdit() {
    if (isDirty.value) {
      leaveTo.value = null
      discardOpen.value = true
      return
    }
    exitEdit()
  }

  function confirmDiscard() {
    const destination = leaveTo.value
    discardOpen.value = false

    if (destination) {
      allowLeave.value = true
      exitEdit()
      void router.push(destination)
      return
    }

    exitEdit()
  }

  watch(discardOpen, (open) => {
    if (!open) leaveTo.value = null
  })

  async function save() {
    saving.value = true
    try {
      const { error } = await updateCustomer(toValue(id), state)
      if (!error) {
        allowLeave.value = true
        editing.value = false
        await refresh()
        allowLeave.value = false
      }
    } finally {
      saving.value = false
    }
  }

  async function toggleAtivo() {
    if (!cliente.value) return

    togglingAtivo.value = true
    try {
      const { error } = await setCustomerAtivo(toValue(id), !cliente.value.ativo)
      if (!error) {
        await refresh()
      }
    } finally {
      togglingAtivo.value = false
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
        allowLeave.value = true
        await router.push(CUSTOMER_ROUTES.list)
      }
    } finally {
      deleting.value = false
      deleteOpen.value = false
    }
  }

  onBeforeRouteLeave((to, _from, next) => {
    if (allowLeave.value || saving.value || !editing.value || !isDirty.value) {
      next()
      return
    }

    leaveTo.value = to.fullPath
    discardOpen.value = true
    next(false)
  })

  onMounted(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editing.value || !isDirty.value || allowLeave.value || saving.value) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    })
  })

  return {
    editing,
    saving,
    togglingAtivo,
    deleting,
    deleteOpen,
    discardOpen,
    discardTitle,
    discardDescription,
    isDirty,
    startEdit,
    cancelEdit,
    confirmDiscard,
    save,
    toggleAtivo,
    removeCustomer
  }
}
