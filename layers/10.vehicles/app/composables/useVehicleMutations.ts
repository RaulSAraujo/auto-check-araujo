import type { VehicleFormState } from '../utils/vehicle-form'
import {
  isVehicleFormValid,
  vehicleFormToInsert,
  vehicleFormToUpdate
} from '../utils/vehicle-form'

function vehicleSaveErrorMessage(message: string): string {
  return message.includes('veiculos_placa_unique')
    ? 'Já existe um veículo com esta placa.'
    : 'Verifique os dados e tente de novo.'
}

export function useVehicleMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function createVehicle(state: VehicleFormState) {
    // Client validation + inline errors live in UForm; silent guard only.
    if (!isVehicleFormValid(state)) {
      return { data: null, error: { message: 'validation' } as const }
    }

    const { data, error } = await supabase
      .from('veiculos')
      .insert(vehicleFormToInsert(state))
      .select('id')
      .single()

    if (error) {
      toast.add({
        title: 'Não foi possível salvar',
        description: vehicleSaveErrorMessage(error.message),
        color: 'error'
      })
      return { data: null, error }
    }

    toast.add({ title: 'Veículo cadastrado', color: 'success' })
    return { data, error: null }
  }

  async function updateVehicle(id: string, state: VehicleFormState) {
    if (!isVehicleFormValid(state)) {
      return { error: { message: 'validation' } as const }
    }

    const { error } = await supabase
      .from('veiculos')
      .update(vehicleFormToUpdate(state))
      .eq('id', id)

    if (error) {
      toast.add({
        title: 'Não foi possível salvar',
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
      toast.add({
        title: 'Não foi possível excluir',
        description: error.message.includes('ordens') || error.message.includes('foreign')
          ? 'Há ordens vinculadas a este veículo.'
          : error.message,
        color: 'error'
      })
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
