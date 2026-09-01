export type OrdemStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type ChecklistResultado = 'ok' | 'atencao' | 'ruim' | 'na'

export const ORDEM_STATUS_LABEL: Record<OrdemStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

export const ORDEM_STATUS_COLOR: Record<OrdemStatus, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  aberta: 'info',
  em_andamento: 'warning',
  concluida: 'success',
  cancelada: 'neutral'
}

export const CHECKLIST_RESULTADO_LABEL: Record<ChecklistResultado, string> = {
  ok: 'OK',
  atencao: 'Atenção',
  ruim: 'Ruim',
  na: 'N/A'
}

export function isOrderEditable(status: OrdemStatus): boolean {
  return status === 'aberta' || status === 'em_andamento'
}

export type OrdemItemTipo = 'servico' | 'peca'
export type OrcamentoStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado'

export const ORDEM_ITEM_TIPO_LABEL: Record<OrdemItemTipo, string> = {
  servico: 'Serviço',
  peca: 'Peça'
}

export const ORCAMENTO_STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado'
}

export const ORCAMENTO_STATUS_COLOR: Record<OrcamentoStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  rascunho: 'neutral',
  aguardando_aprovacao: 'warning',
  aprovado: 'success',
  rejeitado: 'error'
}


export function isBudgetEditable(
  orderStatus: OrdemStatus,
  budgetStatus: OrcamentoStatus
): boolean {
  if (!isOrderEditable(orderStatus)) return false
  return budgetStatus === 'rascunho' || budgetStatus === 'rejeitado'
}
