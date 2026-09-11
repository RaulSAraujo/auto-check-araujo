export type OrdemStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
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
    | 'tratado'
    | 'cancelado'
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
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

export const ORDEM_STATUS_COLOR: Record<OrdemStatus, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  aberta: 'info',
  em_andamento: 'warning',
  concluida: 'success',
  cancelada: 'neutral'
}

export const AGENDAMENTO_STATUS_LABEL: Record<AgendamentoStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  nao_compareceu: 'Não compareceu',
  tratado: 'Tratado',
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
  tratado: 'neutral',
  cancelado: 'neutral'
}

export function isOrderEditable(status: OrdemStatus): boolean {
  return status === 'aberta' || status === 'em_andamento'
}

export function isBudgetEditable(
  orderStatus: OrdemStatus,
  budgetStatus: OrcamentoStatus
): boolean {
  if (!isOrderEditable(orderStatus)) return false
  return budgetStatus === 'rascunho' || budgetStatus === 'rejeitado'
}

/**
 * Conclusão exige orçamento aprovado e pagamento.
 * Total R$ 0 dispensa marcar como pago.
 * Em andamento não exige orçamento — análise/diagnóstico vem antes.
 */
export function canConcludeOrder(order: {
  orcamento_status: string | null
  pago?: boolean | null
  valor_total?: number | null
}): boolean {
  if (order.orcamento_status !== 'aprovado') return false
  const total = Number(order.valor_total) || 0
  if (total <= 0) return true
  return Boolean(order.pago)
}

// ponytail: assert-based self-check — fails loud if conclude rules drift
if (import.meta.dev) {
  const cases: Array<{ ok: boolean, order: Parameters<typeof canConcludeOrder>[0] }> = [
    { ok: false, order: { orcamento_status: 'rascunho', pago: true, valor_total: 100 } },
    { ok: false, order: { orcamento_status: 'aprovado', pago: false, valor_total: 100 } },
    { ok: true, order: { orcamento_status: 'aprovado', pago: true, valor_total: 100 } },
    { ok: true, order: { orcamento_status: 'aprovado', pago: false, valor_total: 0 } }
  ]
  for (const c of cases) {
    if (canConcludeOrder(c.order) !== c.ok) {
      console.error('[oficina] canConcludeOrder self-check failed', c)
    }
  }
}
