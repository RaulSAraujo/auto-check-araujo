import type { FinanceHistoryItem } from '../utils/accounts-payable'
import { monthBounds } from '../utils/finance'

export function useFinanceHistory(selectedMonth: Ref<string>) {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    () => `finance-history-${selectedMonth.value}`,
    async () => {
      const { start, end } = monthBounds(selectedMonth.value)

      const [
        { data: orders, error: ordersError },
        { data: accounts, error: accountsError }
      ] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('id, numero, valor_total, pago_em, forma_pagamento, veiculos(placa)')
          .eq('pago', true)
          .not('pago_em', 'is', null)
          .not('valor_total', 'is', null)
          .gte('pago_em', start)
          .lt('pago_em', end),
        supabase
          .from('financeiro_contas')
          .select('id, descricao, valor, pago_em, forma_pagamento, financeiro_categorias(nome)')
          .eq('status', 'pago')
          .not('pago_em', 'is', null)
          .gte('pago_em', start)
          .lt('pago_em', end)
      ])

      if (ordersError) throw ordersError
      if (accountsError) throw accountsError

      const entradas: FinanceHistoryItem[] = (orders || []).map((order) => {
        const vehicle = Array.isArray(order.veiculos) ? order.veiculos[0] : order.veiculos
        return {
          id: `os-${order.id}`,
          tipo: 'entrada' as const,
          descricao: `OS ${order.numero}`,
          valor: Number(order.valor_total),
          pago_em: order.pago_em as string,
          forma_pagamento: order.forma_pagamento,
          meta: vehicle?.placa ? formatPlaca(vehicle.placa) : null
        }
      })

      const saidas: FinanceHistoryItem[] = (accounts || []).map((account) => {
        const category = Array.isArray(account.financeiro_categorias)
          ? account.financeiro_categorias[0]
          : account.financeiro_categorias
        return {
          id: `conta-${account.id}`,
          tipo: 'saida' as const,
          descricao: account.descricao,
          valor: Number(account.valor),
          pago_em: account.pago_em as string,
          forma_pagamento: account.forma_pagamento,
          meta: category?.nome || null
        }
      })

      return [...entradas, ...saidas].sort(
        (a, b) => new Date(b.pago_em).getTime() - new Date(a.pago_em).getTime()
      )
    },
    { watch: [selectedMonth] }
  )

  return {
    history: computed(() => data.value ?? []),
    pending,
    refresh,
    error
  }
}
