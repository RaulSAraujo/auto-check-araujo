import type { ContaFinanceiraStatus, FormaPagamento } from '~~/shared/types/oficina'

export type AccountsFilter = 'a_pagar' | 'pagas' | 'vencidas' | 'todas'

export type FinanceCategoryDraft = {
  nome: string
}

export type FinanceAccountDraft = {
  descricao: string
  categoria_id: string
  fornecedor_id: string
  valor: number | undefined
  vencimento: string
  observacoes: string
}

export type FinanceAccountRow = {
  id: string
  descricao: string
  categoria_id: string
  fornecedor_id: string | null
  valor: number
  vencimento: string
  status: ContaFinanceiraStatus
  pago_em: string | null
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  financeiro_categorias: { id: string, nome: string } | null
  fornecedores: { id: string, nome: string } | null
}

export type FinanceHistoryItem = {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  pago_em: string
  forma_pagamento: string | null
  meta?: string | null
}

export const ACCOUNTS_FILTER_ITEMS = [
  { label: 'A pagar', value: 'a_pagar' },
  { label: 'Pagas', value: 'pagas' },
  { label: 'Vencidas', value: 'vencidas' },
  { label: 'Todas', value: 'todas' }
] as const

export function emptyFinanceCategoryDraft(): FinanceCategoryDraft {
  return { nome: '' }
}

export function emptyFinanceAccountDraft(): FinanceAccountDraft {
  return {
    descricao: '',
    categoria_id: '',
    fornecedor_id: '',
    valor: undefined,
    vencimento: '',
    observacoes: ''
  }
}

export function isFinanceCategoryDraftValid(draft: FinanceCategoryDraft): boolean {
  return draft.nome.trim().length > 0
}

export function isFinanceAccountDraftValid(draft: FinanceAccountDraft): boolean {
  return (
    draft.descricao.trim().length > 0
    && draft.categoria_id.length > 0
    && draft.vencimento.length > 0
    && draft.valor != null
    && Number(draft.valor) >= 0
  )
}

export function isAccountOverdue(account: Pick<FinanceAccountRow, 'status' | 'vencimento'>, today = todayDateValue()): boolean {
  return account.status === 'a_pagar' && account.vencimento < today
}

export function displayAccountStatus(account: Pick<FinanceAccountRow, 'status' | 'vencimento'>): ContaFinanceiraStatus | 'vencido' {
  if (isAccountOverdue(account)) return 'vencido'
  return account.status
}

export function accountStatusLabel(status: ContaFinanceiraStatus | 'vencido'): string {
  if (status === 'vencido') return 'Vencido'
  const labels: Record<ContaFinanceiraStatus, string> = {
    a_pagar: 'A pagar',
    pago: 'Pago',
    cancelado: 'Cancelado'
  }
  return labels[status]
}

export function accountStatusColor(
  status: ContaFinanceiraStatus | 'vencido'
): 'warning' | 'success' | 'neutral' | 'error' {
  if (status === 'vencido') return 'error'
  const colors: Record<ContaFinanceiraStatus, 'warning' | 'success' | 'neutral'> = {
    a_pagar: 'warning',
    pago: 'success',
    cancelado: 'neutral'
  }
  return colors[status]
}

export function todayDateValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDaysToDateValue(dateValue: string, days: number): string {
  const parts = dateValue.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function filterAccounts(
  accounts: FinanceAccountRow[],
  filter: AccountsFilter,
  today = todayDateValue()
): FinanceAccountRow[] {
  switch (filter) {
    case 'a_pagar':
      return accounts.filter(a => a.status === 'a_pagar' && a.vencimento >= today)
    case 'pagas':
      return accounts.filter(a => a.status === 'pago')
    case 'vencidas':
      return accounts.filter(a => isAccountOverdue(a, today))
    case 'todas':
    default:
      return accounts
  }
}

/** Aplica o filtro de contas no builder PostgREST (paginação server-side). */
export function applyAccountsStatusFilter<T extends {
  eq: (column: string, value: string) => T
  gte: (column: string, value: string) => T
  lt: (column: string, value: string) => T
}>(
  query: T,
  filter: AccountsFilter,
  today = todayDateValue()
): T {
  switch (filter) {
    case 'a_pagar':
      return query.eq('status', 'a_pagar').gte('vencimento', today)
    case 'pagas':
      return query.eq('status', 'pago')
    case 'vencidas':
      return query.eq('status', 'a_pagar').lt('vencimento', today)
    case 'todas':
    default:
      return query
  }
}

export type MarkPaidPayload = {
  forma_pagamento: FormaPagamento
}
