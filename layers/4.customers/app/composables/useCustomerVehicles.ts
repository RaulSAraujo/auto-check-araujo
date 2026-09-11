import type { Veiculo } from '~~/shared/types/database'

const CUSTOMER_VEHICLE_SELECT = 'id, cliente_id, placa, marca, modelo, ano, cor, km_atual, observacoes, created_at, updated_at'

export function useCustomerVehicles(clienteId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `cliente-veiculos-${toValue(clienteId)}`,
    async () => {
      const { data, error } = await supabase
        .from('veiculos')
        .select(CUSTOMER_VEHICLE_SELECT)
        .eq('cliente_id', toValue(clienteId))
        .order('placa', { ascending: true })
        .limit(REPORT_SOFT_LIMIT)

      if (error) throw error
      return data as Veiculo[]
    },
    { lazy: true }
  )
}
