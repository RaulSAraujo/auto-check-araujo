import type { OrdemServico, OrdemServicoInsert, OrdemServicoUpdate } from '~~/shared/types/database'

export interface OrderEditState {
  reclamacao: string
  diagnostico: string
  km_entrada: number | undefined
  observacoes: string
}

export interface OrderFormState {
  veiculo_id: string
  reclamacao: string
  diagnostico: string
  km_entrada: number | undefined
  observacoes: string
}

export function emptyOrderForm(veiculoId = ''): OrderFormState {
  return {
    veiculo_id: veiculoId,
    reclamacao: '',
    diagnostico: '',
    km_entrada: undefined,
    observacoes: ''
  }
}

export function emptyOrderEditForm(): OrderEditState {
  return {
    reclamacao: '',
    diagnostico: '',
    km_entrada: undefined,
    observacoes: ''
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function orderFormToInsert(
  state: OrderFormState,
  abertoPor: string
): OrdemServicoInsert {
  return {
    veiculo_id: state.veiculo_id,
    aberto_por: abertoPor,
    numero: '',
    reclamacao: trimOrNull(state.reclamacao),
    diagnostico: trimOrNull(state.diagnostico),
    km_entrada: state.km_entrada || null,
    observacoes: trimOrNull(state.observacoes),
    status: 'aberta'
  }
}

export function isOrderFormValid(state: OrderFormState): boolean {
  return Boolean(state.veiculo_id)
}

export interface OrderFormFieldError {
  name: 'veiculo_id' | 'km_entrada' | 'reclamacao' | 'diagnostico' | 'observacoes'
  message: string
}

export function validateOrderForm(state: Partial<OrderFormState>): OrderFormFieldError[] {
  const errors: OrderFormFieldError[] = []

  if (!state.veiculo_id) {
    errors.push({
      name: 'veiculo_id',
      message: 'Selecione o veículo pela placa'
    })
  }

  if (state.km_entrada != null && Number.isFinite(state.km_entrada) && state.km_entrada < 0) {
    errors.push({
      name: 'km_entrada',
      message: 'Km de entrada não pode ser negativo'
    })
  }

  return errors
}

export function isOrderFormDirty(
  state: OrderFormState,
  initial: OrderFormState
): boolean {
  return (
    state.veiculo_id !== initial.veiculo_id
    || state.reclamacao !== initial.reclamacao
    || state.diagnostico !== initial.diagnostico
    || state.observacoes !== initial.observacoes
    || state.km_entrada !== initial.km_entrada
  )
}

export function orderEditFromRow(
  ordem: Pick<OrdemServico, 'reclamacao' | 'diagnostico' | 'km_entrada' | 'observacoes'>
): OrderEditState {
  return {
    reclamacao: ordem.reclamacao || '',
    diagnostico: ordem.diagnostico || '',
    km_entrada: ordem.km_entrada ?? undefined,
    observacoes: ordem.observacoes || ''
  }
}

export interface OrderEditFieldError {
  name: 'km_entrada' | 'reclamacao' | 'diagnostico' | 'observacoes'
  message: string
}

export function validateOrderEditForm(state: Partial<OrderEditState>): OrderEditFieldError[] {
  const errors: OrderEditFieldError[] = []

  if (state.km_entrada != null && Number.isFinite(state.km_entrada) && state.km_entrada < 0) {
    errors.push({
      name: 'km_entrada',
      message: 'Km de entrada não pode ser negativo'
    })
  }

  return errors
}

export function isOrderEditDirty(
  state: OrderEditState,
  baseline: OrderEditState
): boolean {
  return (
    state.reclamacao !== baseline.reclamacao
    || state.diagnostico !== baseline.diagnostico
    || state.observacoes !== baseline.observacoes
    || state.km_entrada !== baseline.km_entrada
  )
}

export function orderEditToUpdate(state: OrderEditState): Pick<
  OrdemServicoUpdate,
  'reclamacao' | 'diagnostico' | 'km_entrada' | 'observacoes'
> {
  return {
    reclamacao: trimOrNull(state.reclamacao),
    diagnostico: trimOrNull(state.diagnostico),
    km_entrada: state.km_entrada ?? null,
    observacoes: trimOrNull(state.observacoes)
  }
}
