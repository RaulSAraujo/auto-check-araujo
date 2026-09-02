import type { Veiculo } from '~~/shared/types/database'
import {
  emptyVehicleForm,
  vehicleFormFromRow,
  type VehicleFormState
} from '../utils/vehicle-form'

export function useVehicleForm(
  veiculo?: Ref<Veiculo | null | undefined>,
  initialClienteId = ''
) {
  const state = reactive<VehicleFormState>(emptyVehicleForm(initialClienteId))

  if (veiculo) {
    watch(veiculo, (value) => {
      if (!value) return
      Object.assign(state, vehicleFormFromRow(value))
    }, { immediate: true })
  }

  function reset(clienteId = '') {
    Object.assign(state, emptyVehicleForm(clienteId))
  }

  return {
    state,
    reset
  }
}
