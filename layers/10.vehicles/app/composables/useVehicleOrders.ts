import type { OrdemServico } from '~~/shared/types/database'

const VEHICLE_ORDER_SELECT = 'id, numero, status, aberta_em, concluida_em, valor_total, orcamento_status, veiculo_id'

export function useVehicleOrders(veiculoId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `veiculo-ordens-${toValue(veiculoId)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(VEHICLE_ORDER_SELECT)
        .eq('veiculo_id', toValue(veiculoId))
        .order('aberta_em', { ascending: false })
        .limit(REPORT_SOFT_LIMIT)

      if (error) throw error
      return data as OrdemServico[]
    }
  )
}
