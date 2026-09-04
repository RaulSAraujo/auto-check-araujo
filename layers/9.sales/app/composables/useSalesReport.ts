import type {
  SalesCollaboratorRow,
  SalesOrderRow,
  SalesPeriodPreset,
  SalesSummary
} from '../utils/sales'
import {
  DEFAULT_COMMISSION_RATE,
  rankSalesCollaborators,
  salesOrdersToCsv,
  salesPeriodBounds,
  summarizeSalesOrders
} from '../utils/sales'
import { commissionRateFromPercent } from '#layers/pricing/app/utils/pricing'

const SALES_SELECT = `
  id,
  numero,
  aberto_por,
  concluida_em,
  valor_total,
  pago,
  pago_em,
  forma_pagamento,
  veiculos(placa),
  profiles!ordens_servico_aberto_por_fkey(nome)
`

export function useSalesReport(
  initialPeriod: SalesPeriodPreset = 'month'
) {
  const supabase = useTypedSupabaseClient()
  const period = ref<SalesPeriodPreset>(initialPeriod)
  const collaboratorId = ref<string | null>(null)
  const { params: pricingParams } = usePricingParams()
  const { page, pageSize, rangeBounds } = useListPagination(
    [period, collaboratorId],
    REPORT_PAGE_SIZE
  )

  const commissionRate = computed(() => {
    const percent = pricingParams.value?.comissao_percentual
    if (percent == null) return DEFAULT_COMMISSION_RATE
    return commissionRateFromPercent(Number(percent))
  })

  const { data, pending, refresh, error } = useAsyncData(
    () => `sales-report-${period.value}-${page.value}-${collaboratorId.value ?? 'all'}`,
    async () => {
      const { start, end } = salesPeriodBounds(period.value)
      const { from, to } = rangeBounds()

      let query = supabase
        .from('ordens_servico')
        .select(SALES_SELECT, { count: 'exact' })
        .eq('status', 'concluida')
        .not('valor_total', 'is', null)
        .gte('concluida_em', start)
        .lt('concluida_em', end)
        .order('concluida_em', { ascending: false })
        .range(from, to)

      if (collaboratorId.value) {
        query = query.eq('aberto_por', collaboratorId.value)
      }

      const { data: orders, count, error: ordersError } = await query
      if (ordersError) throw ordersError

      return {
        orders: (orders || []) as SalesOrderRow[],
        total: count ?? 0
      }
    },
    { watch: [period, page, collaboratorId] }
  )

  // Lightweight full-period fetch for KPIs / ranking / CSV (capped)
  const { data: aggregateData } = useAsyncData(
    () => `sales-aggregate-${period.value}`,
    async () => {
      const { start, end } = salesPeriodBounds(period.value)

      const { data: orders, count, error: ordersError } = await supabase
        .from('ordens_servico')
        .select(SALES_SELECT, { count: 'exact' })
        .eq('status', 'concluida')
        .not('valor_total', 'is', null)
        .gte('concluida_em', start)
        .lt('concluida_em', end)
        .order('concluida_em', { ascending: false })
        .limit(REPORT_SOFT_LIMIT)

      if (ordersError) throw ordersError

      return {
        orders: (orders || []) as SalesOrderRow[],
        total: count ?? 0,
        truncated: (count ?? 0) > REPORT_SOFT_LIMIT
      }
    },
    { watch: [period] }
  )

  const pageOrders = computed(() => data.value?.orders ?? [])
  const pageTotal = computed(() => data.value?.total ?? 0)

  const allOrders = computed(() => aggregateData.value?.orders ?? [])
  const truncated = computed(() => aggregateData.value?.truncated ?? false)

  const filteredOrders = computed(() => {
    const id = collaboratorId.value
    if (!id) return allOrders.value
    return allOrders.value.filter(order => order.aberto_por === id)
  })

  const summary = computed<SalesSummary>(() =>
    summarizeSalesOrders(filteredOrders.value, commissionRate.value)
  )

  const collaborators = computed<SalesCollaboratorRow[]>(() =>
    rankSalesCollaborators(filteredOrders.value, commissionRate.value)
  )

  const collaboratorOptions = computed(() => {
    const seen = new Map<string, string>()
    for (const order of allOrders.value) {
      if (!seen.has(order.aberto_por)) {
        seen.set(
          order.aberto_por,
          order.profiles?.nome?.trim() || 'Colaborador'
        )
      }
    }
    return [
      { label: 'Todos', value: null as string | null },
      ...Array.from(seen.entries())
        .map(([id, nome]) => ({ label: nome, value: id as string | null }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    ]
  })

  function exportCsv() {
    if (!import.meta.client) return
    const csv = salesOrdersToCsv(filteredOrders.value)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `vendas-${period.value}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return {
    period,
    collaboratorId,
    collaboratorOptions,
    orders: pageOrders,
    page,
    pageSize,
    total: pageTotal,
    truncated,
    summary,
    collaborators,
    commissionRate,
    pending,
    error,
    refresh,
    exportCsv
  }
}
