import type { Veiculo } from '~~/shared/types/database'

export function useCustomerVehicles(clienteId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `cliente-veiculos-${toValue(clienteId)}`,
    async () => {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('cliente_id', toValue(clienteId))
        .order('placa', { ascending: true })

      if (error) throw error
      return data as Veiculo[]
    }
  )
}
