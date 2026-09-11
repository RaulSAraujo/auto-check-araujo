import type { VeiculoComCliente } from '../utils/vehicle-types'

export function useVehicleQuery(id: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `veiculo-${toValue(id)}`,
    async () => {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*, clientes(id, nome)')
        .eq('id', toValue(id))
        .single()

      if (error) throw error
      return data as VeiculoComCliente
    },
    { lazy: true }
  )
}
