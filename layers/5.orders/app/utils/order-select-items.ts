import type { OrdemStatus } from '~~/shared/types/oficina'

export const ORDEM_STATUS_FILTER_ALL = 'all' as const

export type OrdemStatusFilter = typeof ORDEM_STATUS_FILTER_ALL | OrdemStatus

export const ORDEM_STATUS_SELECT_ITEMS = [
  { label: 'Aberta', value: 'aberta' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Concluída', value: 'concluida' },
  { label: 'Cancelada', value: 'cancelada' }
] as const

export const ORDEM_STATUS_FILTER_ITEMS = [
  { label: 'Todos', value: ORDEM_STATUS_FILTER_ALL },
  ...ORDEM_STATUS_SELECT_ITEMS
] as const
