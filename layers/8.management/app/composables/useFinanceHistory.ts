import type { FinanceHistoryItem } from '../utils/accounts-payable'
import { monthValueToDate } from '../utils/finance'

export function useFinanceHistory(
  selectedMonth: Ref<string>,
  options?: { enabled?: Ref<boolean> }
) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)
  const { page, pageSize, rangeBounds } = useListPagination(
    [selectedMonth],
    REPORT_PAGE_SIZE
  )

  const { data, pending, refresh, error } = useAsyncData(
    () => `finance-history-${selectedMonth.value}-${page.value}`,
    async () => {
      if (!enabled.value) {
        return { items: [], total: 0 }
      }

      const monthDate = monthValueToDate(selectedMonth.value)
      const { from } = rangeBounds()

      const { data: rpcRows, error: rpcError } = await supabase.rpc(
        'finance_statement',
        { p_mes: monthDate, p_limit: pageSize, p_offset: from }
      )

      if (rpcError) throw rpcError
      if (!rpcRows || !Array.isArray(rpcRows) || rpcRows.length === 0) {
        return { items: [], total: 0 }
      }

      const total = Number(rpcRows[0]?.total_count ?? rpcRows.length)
      const items: FinanceHistoryItem[] = rpcRows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        tipo: (row.tipo === 'entrada' ? 'entrada' : 'saida') as 'entrada' | 'saida',
        descricao: String(row.descricao),
        valor: Number(row.valor),
        pago_em: String(row.pago_em),
        forma_pagamento: row.forma_pagamento ? String(row.forma_pagamento) : null,
        meta: row.meta
          ? (row.tipo === 'entrada' ? formatPlaca(String(row.meta)) : String(row.meta))
          : null
      }))

      return { items, total }
    },
    { watch: [selectedMonth, page, enabled], lazy: true }
  )

  return {
    history: computed(() => data.value?.items ?? []),
    page,
    pageSize,
    total: computed(() => data.value?.total ?? 0),
    pending,
    refresh,
    error
  }
}
