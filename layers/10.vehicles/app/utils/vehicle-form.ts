import type { Veiculo, VeiculoInsert, VeiculoUpdate } from '~~/shared/types/database'

export interface VehicleFormState {
  cliente_id: string
  placa: string
  marca: string
  modelo: string
  ano: number | undefined
  cor: string
  km_atual: number | undefined
  observacoes: string
}

export type VehicleFormFieldName
  = | 'cliente_id'
    | 'placa'
    | 'marca'
    | 'modelo'
    | 'ano'
    | 'cor'
    | 'km_atual'
    | 'observacoes'

export interface VehicleFormFieldError {
  name: VehicleFormFieldName
  message: string
}

const MIN_YEAR = 1950

export function emptyVehicleForm(initialClienteId = ''): VehicleFormState {
  return {
    cliente_id: initialClienteId,
    placa: '',
    marca: '',
    modelo: '',
    ano: undefined,
    cor: '',
    km_atual: undefined,
    observacoes: ''
  }
}

export function vehicleFormFromRow(veiculo: Veiculo): VehicleFormState {
  return {
    cliente_id: veiculo.cliente_id,
    placa: formatPlacaInput(veiculo.placa),
    marca: veiculo.marca || '',
    modelo: veiculo.modelo || '',
    ano: veiculo.ano ?? undefined,
    cor: veiculo.cor || '',
    km_atual: veiculo.km_atual ?? undefined,
    observacoes: veiculo.observacoes || ''
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

/** Máscara de digitação: ABC-1D23 (até 7 alfanuméricos). */
export function formatPlacaInput(value: string): string {
  const normalized = normalizePlaca(value).slice(0, 7)
  if (normalized.length <= 3) return normalized
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
}

function normalizedPlaca(state: VehicleFormState): string {
  return normalizePlaca(state.placa)
}

function maxVehicleYear(): number {
  return new Date().getFullYear() + 1
}

function isFilledNumber(value: number | undefined): value is number {
  return value != null && !Number.isNaN(Number(value))
}

export function vehicleFormToInsert(state: VehicleFormState): VeiculoInsert {
  return {
    cliente_id: state.cliente_id,
    placa: normalizedPlaca(state),
    marca: trimOrNull(state.marca),
    modelo: trimOrNull(state.modelo),
    ano: isFilledNumber(state.ano) ? Number(state.ano) : null,
    cor: trimOrNull(state.cor),
    km_atual: isFilledNumber(state.km_atual) ? Number(state.km_atual) : null,
    observacoes: trimOrNull(state.observacoes)
  }
}

export function vehicleFormToUpdate(state: VehicleFormState): VeiculoUpdate {
  return vehicleFormToInsert(state)
}

export function validateVehicleForm(
  state: Partial<VehicleFormState>
): VehicleFormFieldError[] {
  const errors: VehicleFormFieldError[] = []

  if (!state.cliente_id) {
    errors.push({
      name: 'cliente_id',
      message: 'Selecione o proprietário'
    })
  }

  const plate = normalizePlaca(state.placa || '')
  if (!plate) {
    errors.push({
      name: 'placa',
      message: 'Digite a placa'
    })
  }
  else if (plate.length !== 7) {
    errors.push({
      name: 'placa',
      message: 'Placa incompleta. Use 7 caracteres (ex.: ABC1D23)'
    })
  }

  if (isFilledNumber(state.ano)) {
    const year = Number(state.ano)
    const maxYear = maxVehicleYear()
    if (year < MIN_YEAR || year > maxYear) {
      errors.push({
        name: 'ano',
        message: `Ano entre ${MIN_YEAR} e ${maxYear}`
      })
    }
  }

  if (isFilledNumber(state.km_atual) && Number(state.km_atual) < 0) {
    errors.push({
      name: 'km_atual',
      message: 'KM atual não pode ser negativo'
    })
  }

  return errors
}

export function isVehicleFormValid(state: VehicleFormState): boolean {
  return validateVehicleForm(state).length === 0
}

export function isVehicleFormDirty(
  state: VehicleFormState,
  initial: VehicleFormState = emptyVehicleForm()
): boolean {
  return (
    state.cliente_id !== initial.cliente_id
    || normalizedPlaca(state) !== normalizePlaca(initial.placa)
    || state.marca.trim() !== initial.marca.trim()
    || state.modelo.trim() !== initial.modelo.trim()
    || (state.ano ?? null) !== (initial.ano ?? null)
    || state.cor.trim() !== initial.cor.trim()
    || (state.km_atual ?? null) !== (initial.km_atual ?? null)
    || state.observacoes.trim() !== initial.observacoes.trim()
  )
}
