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

export function useSalesReport(
  initialPeriod: SalesPeriodPreset = 'month'
) {
  const supabase = useTypedSupabaseClient()
  const period = ref<SalesPeriodPreset>(initialPeriod)
  const collaboratorId = ref<string | null>(null)
  const { params: pricingParams } = usePricingParams()

  const commissionRate = computed(() => {
    const percent = pricingParams.value?.comissao_percentual
    if (percent == null) return DEFAULT_COMMISSION_RATE
    return commissionRateFromPercent(Number(percent))
  })

  const { data, pending, refresh, error } = useAsyncData(
    () => `sales-report-${period.value}`,
    async () => {
      const { start, end } = salesPeriodBounds(period.value)

      const { data: orders, error: ordersError } = await supabase
        .from('ordens_servico')
        .select(`
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
        `)
        .eq('status', 'concluida')
        .not('valor_total', 'is', null)
        .gte('concluida_em', start)
        .lt('concluida_em', end)
        .order('concluida_em', { ascending: false })

      if (ordersError) throw ordersError
      return (orders || []) as SalesOrderRow[]
    },
    { watch: [period] }
  )

  const allOrders = computed(() => data.value ?? [])

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
    orders: filteredOrders,
    summary,
    collaborators,
    commissionRate,
    pending,
    error,
    refresh,
    exportCsv
  }
}
