import type { FinanceOrderRow, FinanceSummary } from '../utils/finance'
import { currentMonthValue, monthBounds, monthValueToDate } from '../utils/finance'

const EMPTY_SUMMARY: FinanceSummary = {
  total_faturado: 0,
  total_pago: 0,
  total_pendente: 0,
  qtd_os: 0,
  total_a_pagar: 0,
  total_pago_despesas: 0,
  total_vencido: 0,
  entradas: 0,
  saidas: 0,
  saldo: 0
}

const FINANCE_ORDER_SELECT = 'id, numero, concluida_em, valor_total, pago, pago_em, forma_pagamento, veiculos(placa)'

function normalizeSummary(raw: unknown): FinanceSummary {
  const data = (raw || {}) as Partial<FinanceSummary>
  return {
    total_faturado: Number(data.total_faturado ?? 0),
    total_pago: Number(data.total_pago ?? 0),
    total_pendente: Number(data.total_pendente ?? 0),
    qtd_os: Number(data.qtd_os ?? 0),
    total_a_pagar: Number(data.total_a_pagar ?? 0),
    total_pago_despesas: Number(data.total_pago_despesas ?? 0),
    total_vencido: Number(data.total_vencido ?? 0),
    entradas: Number(data.entradas ?? 0),
    saidas: Number(data.saidas ?? 0),
    saldo: Number(data.saldo ?? 0)
  }
}

export function useFinanceReport(initialMonth = currentMonthValue()) {
  const supabase = useTypedSupabaseClient()
  const selectedMonth = ref(initialMonth)
  const { page, pageSize, rangeBounds } = useListPagination(
    [selectedMonth],
    REPORT_PAGE_SIZE
  )

  const { data, pending, refresh } = useAsyncData(
    () => `finance-report-${selectedMonth.value}-${page.value}`,
    async () => {
      const monthDate = monthValueToDate(selectedMonth.value)
      const { start, end } = monthBounds(selectedMonth.value)
      const { from, to } = rangeBounds()

      const [
        { data: summary, error: summaryError },
        { data: orders, count, error: ordersError }
      ] = await Promise.all([
        supabase.rpc('financeiro_resumo', { p_mes: monthDate }),
        supabase
          .from('ordens_servico')
          .select(FINANCE_ORDER_SELECT, { count: 'exact' })
          .eq('status', 'concluida')
          .not('valor_total', 'is', null)
          .gte('concluida_em', start)
          .lt('concluida_em', end)
          .order('concluida_em', { ascending: false })
          .range(from, to)
      ])

      if (summaryError) throw summaryError
      if (ordersError) throw ordersError

      return {
        summary: normalizeSummary(summary),
        orders: (orders || []) as FinanceOrderRow[],
        total: count ?? 0
      }
    },
    { watch: [selectedMonth, page] }
  )

  const summary = computed(() => data.value?.summary ?? EMPTY_SUMMARY)
  const orders = computed(() => data.value?.orders ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    selectedMonth,
    summary,
    orders,
    page,
    pageSize,
    total,
    pending,
    refresh
  }
}

export function useFinanceSummary(month = currentMonthValue()) {
  const supabase = useTypedSupabaseClient()
  const { papel } = usePermissions()

  return useAsyncData(
    () => `finance-summary-${month}-${papel.value}`,
    async () => {
      if (papel.value !== 'gerente') return null

      const { data, error } = await supabase.rpc('financeiro_resumo', {
        p_mes: monthValueToDate(month)
      })

      if (error) throw error
      return normalizeSummary(data)
    },
    { watch: [papel] }
  )
}
