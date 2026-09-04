import type { CustomerOrderItem } from '../utils/customer-table-columns'

/** Smaller page for embedded history on the customer detail screen. */
export const CUSTOMER_ORDERS_PAGE_SIZE = 10

export async function useCustomerOrders(clienteId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()
  const clienteIdRef = computed(() => toValue(clienteId))
  const { page, pageSize, rangeBounds } = useListPagination(
    [clienteIdRef],
    CUSTOMER_ORDERS_PAGE_SIZE
  )

  const { data, pending, refresh } = await useAsyncData(
    () => `cliente-ordens-${clienteIdRef.value}`,
    async () => {
      const { from, to } = rangeBounds()
      const { data: rows, count, error } = await supabase
        .from('ordens_servico')
        .select('*, veiculos!inner(id, placa, cliente_id)', { count: 'exact' })
        .eq('veiculos.cliente_id', clienteIdRef.value)
        .order('aberta_em', { ascending: false })
        .range(from, to)

      if (error) throw error
      return {
        items: (rows || []) as CustomerOrderItem[],
        total: count ?? 0
      }
    },
    { watch: [page, clienteIdRef] }
  )

  const ordens = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    ordens,
    total,
    page,
    pageSize,
    pending,
    refresh
  }
}
