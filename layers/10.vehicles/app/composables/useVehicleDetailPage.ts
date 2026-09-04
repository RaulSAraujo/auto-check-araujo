import type { VehicleFormState } from '../utils/vehicle-form'
import {
  isVehicleFormDirty,
  vehicleFormFromRow
} from '../utils/vehicle-form'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

export function useVehicleDetailPage(
  id: MaybeRefOrGetter<string>,
  veiculo: Ref<Awaited<ReturnType<typeof useVehicleQuery>>['data']['value']>,
  state: VehicleFormState,
  refresh: () => Promise<void>
) {
  const router = useRouter()
  const { updateVehicle, deleteVehicle } = useVehicleMutations()

  const editing = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const deleteOpen = ref(false)
  const discardOpen = ref(false)
  const leaveTo = ref<string | null>(null)
  const allowLeave = ref(false)

  const isDirty = computed(() => {
    if (!editing.value || !veiculo.value) return false
    return isVehicleFormDirty(state, vehicleFormFromRow(veiculo.value))
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
    if (!veiculo.value) return
    Object.assign(state, vehicleFormFromRow(veiculo.value))
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
      const { error } = await updateVehicle(toValue(id), state)
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

  async function removeVehicle() {
    deleting.value = true
    try {
      const { error } = await deleteVehicle(toValue(id))
      if (!error) {
        allowLeave.value = true
        await router.push(VEHICLE_ROUTES.list)
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
    removeVehicle
  }
}
