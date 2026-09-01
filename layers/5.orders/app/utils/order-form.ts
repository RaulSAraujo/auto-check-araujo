import type { OrdemServico, OrdemServicoInsert, OrdemServicoUpdate } from '~~/shared/types/database'

export interface OrderEditState {
  reclamacao: string
  km_entrada: number | undefined
  observacoes: string
}

export interface OrderFormState {
  veiculo_id: string
  reclamacao: string
  km_entrada: number | undefined
  observacoes: string
}

export function emptyOrderForm(veiculoId = ''): OrderFormState {
  return {
    veiculo_id: veiculoId,
    reclamacao: '',
    km_entrada: undefined,
    observacoes: ''
  }
}

export function emptyOrderEditForm(): OrderEditState {
  return {
    reclamacao: '',
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
    km_entrada: state.km_entrada || null,
    observacoes: trimOrNull(state.observacoes),
    status: 'aberta'
  }
}

export function isOrderFormValid(state: OrderFormState): boolean {
  return Boolean(state.veiculo_id)
}

export function orderEditFromRow(
  ordem: Pick<OrdemServico, 'reclamacao' | 'km_entrada' | 'observacoes'>
): OrderEditState {
  return {
    reclamacao: ordem.reclamacao || '',
    km_entrada: ordem.km_entrada ?? undefined,
    observacoes: ordem.observacoes || ''
  }
}

export function orderEditToUpdate(state: OrderEditState): Pick<
  OrdemServicoUpdate,
  'reclamacao' | 'km_entrada' | 'observacoes'
> {
  return {
    reclamacao: trimOrNull(state.reclamacao),
    km_entrada: state.km_entrada ?? null,
    observacoes: trimOrNull(state.observacoes)
  }
}
