import type { VehicleFormState } from '../utils/vehicle-form'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

export function useVehicleDetailPage(
  id: MaybeRefOrGetter<string>,
  state: VehicleFormState,
  refresh: () => Promise<void>
) {
  const router = useRouter()
  const { updateVehicle, deleteVehicle } = useVehicleMutations()

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
      const { error } = await updateVehicle(toValue(id), state)
      if (!error) {
        editing.value = false
        await refresh()
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
        await router.push(VEHICLE_ROUTES.list)
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
    removeVehicle
  }
}
