import type { CustomerOrderItem } from '../utils/customer-table-columns'

export function useCustomerOrders(clienteId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `cliente-ordens-${toValue(clienteId)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, veiculos!inner(id, placa, cliente_id)')
        .eq('veiculos.cliente_id', toValue(clienteId))
        .order('aberta_em', { ascending: false })

      if (error) throw error
      return (data || []) as CustomerOrderItem[]
    }
  )
}
