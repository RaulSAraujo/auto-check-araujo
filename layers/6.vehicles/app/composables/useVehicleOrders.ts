import type { OrdemServico } from '~~/shared/types/database'

export function useVehicleOrders(veiculoId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `veiculo-ordens-${toValue(veiculoId)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('veiculo_id', toValue(veiculoId))
        .order('aberta_em', { ascending: false })

      if (error) throw error
      return data as OrdemServico[]
    }
  )
}
