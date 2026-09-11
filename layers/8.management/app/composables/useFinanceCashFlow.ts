import type { Ref } from 'vue'
import { formatCashFlowMonthLabel } from '../utils/finance'

export type CashFlowRow = {
  mes: string
  mes_label: string
  entradas: number
  saidas: number
  saldo: number
}

export function useFinanceCashFlow(options?: { enabled?: Ref<boolean> }) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)

  const { data, pending, refresh, error } = useAsyncData(
    'finance-cashflow-6months',
    async (): Promise<CashFlowRow[]> => {
      if (!enabled.value) return []

      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const pMesFinal = `${today.getFullYear()}-${month}-01`

      const { data: rows, error: rpcError } = await supabase.rpc(
        'finance_cashflow_6_months',
        { p_mes_final: pMesFinal }
      )

      if (rpcError) throw rpcError
      if (!rows || !Array.isArray(rows)) return []

      return rows.map((row: Record<string, unknown>) => {
        const mes = String(row.mes ?? '')
        return {
          mes,
          mes_label: formatCashFlowMonthLabel(mes),
          entradas: Number(row.entradas ?? 0),
          saidas: Number(row.saidas ?? 0),
          saldo: Number(row.saldo ?? 0)
        }
      })
    },
    {
      lazy: true,
      watch: [enabled]
    }
  )

  return {
    data: computed(() => data.value ?? []),
    pending,
    refresh,
    error
  }
}
