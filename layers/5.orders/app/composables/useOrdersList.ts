import type { OrderListItem } from '../types/orders'
import { ORDEM_STATUS_FILTER_ALL, ORDEM_STATUS_FILTER_ITEMS, type OrdemStatusFilter } from '../utils/order-select-items'

const ORDER_LIST_SELECT = '*, veiculos!inner(id, placa, marca, modelo, clientes(id, nome))'

export async function useOrdersList() {
  const supabase = useTypedSupabaseClient()

  const statusFilter = useRouteQueryState<OrdemStatusFilter>('status', ORDEM_STATUS_FILTER_ALL, ORDEM_STATUS_FILTER_ITEMS.map(item => item.value))
  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
  const { page, pageSize, rangeBounds } = useListPagination([debouncedQ, statusFilter])

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, SEARCH_DEBOUNCE_MS)
  })

  const { data, pending } = await useAsyncData(
    'ordens-list',
    async () => {
      const { from, to } = rangeBounds()
      const pattern = ilikePattern(debouncedQ.value)
      const placaPattern = ilikePattern(normalizePlaca(debouncedQ.value) || debouncedQ.value)

      let query = supabase
        .from('ordens_servico')
        .select(ORDER_LIST_SELECT, { count: 'exact' })
        .order('aberta_em', { ascending: false })
        .range(from, to)

      if (statusFilter.value !== ORDEM_STATUS_FILTER_ALL) {
        query = query.eq('status', statusFilter.value)
      }

      if (pattern) {
        const placa = placaPattern || pattern
        // PostgREST .or() cannot reach embedded relations — resolve veiculo_id
        // via placa and cliente.nome, then OR on the parent table.
        const [{ data: byPlaca }, { data: matchedClientes }] = await Promise.all([
          supabase.from('veiculos').select('id').ilike('placa', placa),
          supabase.from('clientes').select('id').ilike('nome', pattern)
        ])

        const veiculoIds = new Set(byPlaca?.map(v => v.id) ?? [])
        const clienteIds = matchedClientes?.map(c => c.id) ?? []
        if (clienteIds.length > 0) {
          const { data: byCliente } = await supabase
            .from('veiculos')
            .select('id')
            .in('cliente_id', clienteIds)
          for (const row of byCliente ?? []) veiculoIds.add(row.id)
        }

        let orFilter = `numero.ilike.${pattern},reclamacao.ilike.${pattern}`
        if (veiculoIds.size > 0) {
          orFilter += `,veiculo_id.in.(${[...veiculoIds].join(',')})`
        }
        query = query.or(orFilter)
      }

      const { data: rows, count, error } = await query
      if (error) throw error

      return {
        items: (rows || []) as OrderListItem[],
        total: count ?? 0
      }
    },
    { watch: [statusFilter, debouncedQ, page], lazy: true }
  )

  const ordens = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    q,
    page,
    pageSize,
    total,
    statusFilter,
    statusItems: ORDEM_STATUS_FILTER_ITEMS,
    ordens,
    pending
  }
}
