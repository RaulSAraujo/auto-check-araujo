import type { VehicleFormState } from '../utils/vehicle-form'
import {
  isVehicleFormValid,
  vehicleFormToInsert,
  vehicleFormToUpdate
} from '../utils/vehicle-form'

function vehicleSaveErrorMessage(message: string): string {
  return message.includes('veiculos_placa_unique')
    ? 'Já existe um Veículo com esta placa.'
    : message
}

export function useVehicleMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  function validateForm(state: VehicleFormState): boolean {
    if (!state.cliente_id) {
      toast.add({ title: 'Selecione o proprietário', color: 'warning' })
      return false
    }

    if (!isVehicleFormValid(state)) {
      toast.add({
        title: 'Placa inválida',
        description: 'Informe 7 caracteres (ex.: ABC1D23).',
        color: 'warning'
      })
      return false
    }

    if (state.km_atual != null && state.km_atual < 0) {
      toast.add({
        title: 'KM inválido',
        description: 'O KM atual não pode ser negativo.',
        color: 'warning'
      })
      return false
    }

    return true
  }

  async function createVehicle(state: VehicleFormState) {
    if (!validateForm(state)) return { data: null, error: null }

    const { data, error } = await supabase
      .from('veiculos')
      .insert(vehicleFormToInsert(state))
      .select('id')
      .single()

    if (error) {
      toast.add({
        title: 'Erro ao salvar',
        description: vehicleSaveErrorMessage(error.message),
        color: 'error'
      })
      return { data: null, error }
    }

    toast.add({ title: 'Veículo cadastrado', color: 'success' })
    return { data, error: null }
  }

  async function updateVehicle(id: string, state: VehicleFormState) {
    if (!validateForm(state)) return { error: null }

    const { error } = await supabase
      .from('veiculos')
      .update(vehicleFormToUpdate(state))
      .eq('id', id)

    if (error) {
      toast.add({
        title: 'Erro ao salvar',
        description: vehicleSaveErrorMessage(error.message),
        color: 'error'
      })
      return { error }
    }

    toast.add({ title: 'Veículo atualizado', color: 'success' })
    return { error: null }
  }

  async function deleteVehicle(id: string) {
    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao excluir', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Veículo excluído', color: 'success' })
    return { error: null }
  }

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle
  }
}
