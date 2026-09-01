import type { Veiculo, VeiculoInsert, VeiculoUpdate } from '~~/shared/types/database'

export interface VehicleFormState {
  cliente_id: string
  placa: string
  marca: string
  modelo: string
  ano: number | undefined
  cor: string
  observacoes: string
}

export function emptyVehicleForm(initialClienteId = ''): VehicleFormState {
  return {
    cliente_id: initialClienteId,
    placa: '',
    marca: '',
    modelo: '',
    ano: undefined,
    cor: '',
    observacoes: ''
  }
}

export function vehicleFormFromRow(veiculo: Veiculo): VehicleFormState {
  return {
    cliente_id: veiculo.cliente_id,
    placa: formatPlaca(veiculo.placa),
    marca: veiculo.marca || '',
    modelo: veiculo.modelo || '',
    ano: veiculo.ano ?? undefined,
    cor: veiculo.cor || '',
    observacoes: veiculo.observacoes || ''
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

function normalizedPlaca(state: VehicleFormState): string {
  return normalizePlaca(state.placa)
}

export function vehicleFormToInsert(state: VehicleFormState): VeiculoInsert {
  return {
    cliente_id: state.cliente_id,
    placa: normalizedPlaca(state),
    marca: trimOrNull(state.marca),
    modelo: trimOrNull(state.modelo),
    ano: state.ano || null,
    cor: trimOrNull(state.cor),
    observacoes: trimOrNull(state.observacoes)
  }
}

export function vehicleFormToUpdate(state: VehicleFormState): VeiculoUpdate {
  return vehicleFormToInsert(state)
}

export function isVehicleFormValid(state: VehicleFormState): boolean {
  return Boolean(state.cliente_id) && normalizedPlaca(state).length === 7
}
