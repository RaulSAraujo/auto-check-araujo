export type OrdemStatus = 'aberta' | 'em_andamento' | 'retrabalho' | 'concluida' | 'cancelada'
export type ChecklistResultado = 'ok' | 'atencao' | 'ruim' | 'na'
export type ColaboradorPapel = 'recepcao' | 'mecanico' | 'gerente'
export type OrdemItemTipo = 'servico' | 'peca' | 'kit'
export type OrcamentoStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado'
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'
export type ContaFinanceiraStatus = 'a_pagar' | 'pago' | 'cancelado'
export type AgendamentoStatus
  = | 'agendado'
    | 'confirmado'
    | 'em_atendimento'
    | 'concluido'
    | 'nao_compareceu'
    | 'cancelado'
export type PresencaStatus = 'presente' | 'atrasado' | 'ausente' | 'folga'
export type FaltaTipo = 'justificada' | 'injustificada'
export type OcorrenciaTipo
  = | 'advertencia'
    | 'elogio'
    | 'acidente'
    | 'atraso_recorrente'
    | 'outro'

export const COLABORADOR_PAPEL_LABEL: Record<ColaboradorPapel, string> = {
  recepcao: 'Recepção',
  mecanico: 'Mecânico',
  gerente: 'Gerente'
}

export const ORDEM_ITEM_TIPO_LABEL: Record<OrdemItemTipo, string> = {
  servico: 'Serviço',
  peca: 'Peça',
  kit: 'Kit'
}

export const ORCAMENTO_STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Pré-orçamento',
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

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito'
}

export const FORMA_PAGAMENTO_SELECT_ITEMS = [
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'PIX', value: 'pix' },
  { label: 'Cartão de crédito', value: 'cartao_credito' },
  { label: 'Cartão de débito', value: 'cartao_debito' }
] as const

export const CONTA_FINANCEIRA_STATUS_LABEL: Record<ContaFinanceiraStatus, string> = {
  a_pagar: 'A pagar',
  pago: 'Pago',
  cancelado: 'Cancelado'
}

export const CONTA_FINANCEIRA_STATUS_COLOR: Record<
  ContaFinanceiraStatus,
  'warning' | 'success' | 'neutral' | 'error'
> = {
  a_pagar: 'warning',
  pago: 'success',
  cancelado: 'neutral'
}

export const ORDEM_STATUS_LABEL: Record<OrdemStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  retrabalho: 'Retrabalho',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

export const ORDEM_STATUS_COLOR: Record<OrdemStatus, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  aberta: 'info',
  em_andamento: 'warning',
  retrabalho: 'error',
  concluida: 'success',
  cancelada: 'neutral'
}

export const CHECKLIST_RESULTADO_LABEL: Record<ChecklistResultado, string> = {
  ok: 'OK',
  atencao: 'Atenção',
  ruim: 'Ruim',
  na: 'N/A'
}

export const AGENDAMENTO_STATUS_LABEL: Record<AgendamentoStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  nao_compareceu: 'Não compareceu',
  cancelado: 'Cancelado'
}

export const AGENDAMENTO_STATUS_COLOR: Record<
  AgendamentoStatus,
  'info' | 'success' | 'warning' | 'neutral' | 'error' | 'primary'
> = {
  agendado: 'info',
  confirmado: 'success',
  em_atendimento: 'warning',
  concluido: 'neutral',
  nao_compareceu: 'error',
  cancelado: 'neutral'
}

export const PRESENCA_STATUS_LABEL: Record<PresencaStatus, string> = {
  presente: 'Presente',
  atrasado: 'Atrasado',
  ausente: 'Ausente',
  folga: 'Folga'
}

export const PRESENCA_STATUS_COLOR: Record<
  PresencaStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  presente: 'success',
  atrasado: 'warning',
  ausente: 'error',
  folga: 'neutral'
}

export const FALTA_TIPO_LABEL: Record<FaltaTipo, string> = {
  justificada: 'Justificada',
  injustificada: 'Injustificada'
}

export const OCORRENCIA_TIPO_LABEL: Record<OcorrenciaTipo, string> = {
  advertencia: 'Advertência',
  elogio: 'Elogio',
  acidente: 'Acidente',
  atraso_recorrente: 'Atraso recorrente',
  outro: 'Outro'
}

export function isOrderEditable(status: OrdemStatus): boolean {
  return status === 'aberta' || status === 'em_andamento' || status === 'retrabalho'
}

export function isBudgetEditable(
  orderStatus: OrdemStatus,
  budgetStatus: OrcamentoStatus
): boolean {
  if (!isOrderEditable(orderStatus)) return false
  return budgetStatus === 'rascunho' || budgetStatus === 'rejeitado'
}
