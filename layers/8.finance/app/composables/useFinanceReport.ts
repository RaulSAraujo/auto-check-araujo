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

  const { data, pending, refresh } = useAsyncData(
    () => `finance-report-${selectedMonth.value}`,
    async () => {
      const monthDate = monthValueToDate(selectedMonth.value)
      const { start, end } = monthBounds(selectedMonth.value)

      const [{ data: summary, error: summaryError }, { data: orders, error: ordersError }] = await Promise.all([
        supabase.rpc('financeiro_resumo', { p_mes: monthDate }),
        supabase
          .from('ordens_servico')
          .select('id, numero, concluida_em, valor_total, pago, pago_em, forma_pagamento, veiculos(placa)')
          .eq('status', 'concluida')
          .not('valor_total', 'is', null)
          .gte('concluida_em', start)
          .lt('concluida_em', end)
          .order('concluida_em', { ascending: false })
      ])

      if (summaryError) throw summaryError
      if (ordersError) throw ordersError

      return {
        summary: normalizeSummary(summary),
        orders: (orders || []) as FinanceOrderRow[]
      }
    },
    { watch: [selectedMonth] }
  )

  const summary = computed(() => data.value?.summary ?? EMPTY_SUMMARY)
  const orders = computed(() => data.value?.orders ?? [])

  return {
    selectedMonth,
    summary,
    orders,
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
