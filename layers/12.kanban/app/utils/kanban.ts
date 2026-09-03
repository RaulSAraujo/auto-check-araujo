import type { OrcamentoStatus, OrdemStatus } from '~~/shared/types/oficina'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

export type KanbanColumnId = 'agendados' | 'pre_orcamento' | 'em_andamento' | 'retrabalho' | 'finalizados'

export const KANBAN_COLUMNS: ReadonlyArray<{
  id: KanbanColumnId
  label: string
  hint: string
}> = [
  { id: 'agendados', label: 'Aguardando execução', hint: 'Orçamento aprovado — o serviço ainda não começou' },
  { id: 'pre_orcamento', label: 'Pré-orçamento', hint: 'OS aberta, orçamento ainda não aprovado' },
  { id: 'em_andamento', label: 'Em andamento', hint: 'Serviço em execução' },
  { id: 'retrabalho', label: 'Retrabalho', hint: 'OS reaberta' },
  { id: 'finalizados', label: 'Finalizados', hint: 'Concluídas nos últimos 14 dias' }
] as const

/** Hours in stage before an overdue alert. */
export const KANBAN_OVERDUE_HOURS: Record<KanbanColumnId, number | null> = {
  agendados: 48,
  pre_orcamento: 24,
  em_andamento: 8,
  retrabalho: 8,
  finalizados: null
}

export function resolveKanbanColumn(
  status: OrdemStatus | string,
  budgetStatus: OrcamentoStatus | string
): KanbanColumnId | null {
  if (status === 'cancelada') return null
  if (status === 'concluida') return 'finalizados'
  if (status === 'retrabalho') return 'retrabalho'
  if (status === 'em_andamento') return 'em_andamento'
  if (status === 'aberta') {
    return budgetStatus === 'aprovado' ? 'agendados' : 'pre_orcamento'
  }
  return null
}

/** Approximate stage start: last update for open stages; completion for finished. */
export function resolveStageStartedAt(order: {
  status: string
  aberta_em: string
  updated_at: string
  concluida_em: string | null
}): string {
  if (order.status === 'concluida' && order.concluida_em) {
    return order.concluida_em
  }
  if (order.status === 'em_andamento' || order.status === 'retrabalho') {
    return order.updated_at
  }
  return order.updated_at || order.aberta_em
}

export function formatStageDuration(startedAt: string, now = new Date()): string {
  const start = new Date(startedAt).getTime()
  if (Number.isNaN(start)) return EMPTY_VALUE

  const diffMs = Math.max(0, now.getTime() - start)
  const totalMinutes = Math.floor(diffMs / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}min`
  return `${minutes}min`
}

export function isKanbanOverdue(
  column: KanbanColumnId,
  startedAt: string,
  now = new Date()
): boolean {
  const limitHours = KANBAN_OVERDUE_HOURS[column]
  if (limitHours == null) return false

  const start = new Date(startedAt).getTime()
  if (Number.isNaN(start)) return false

  const limitMs = limitHours * 60 * 60 * 1000
  return now.getTime() - start >= limitMs
}
