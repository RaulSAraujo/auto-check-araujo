import type { FinanceOrderRow, FinanceSummary } from '../utils/payment'
import { currentMonthValue, monthBounds, monthValueToDate } from '../utils/payment'

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
        summary: summary as FinanceSummary,
        orders: (orders || []) as FinanceOrderRow[]
      }
    },
    { watch: [selectedMonth] }
  )

  const summary = computed(() => data.value?.summary ?? {
    total_faturado: 0,
    total_pago: 0,
    total_pendente: 0,
    qtd_os: 0
  })

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
      return data as FinanceSummary
    },
    { watch: [papel] }
  )
}
