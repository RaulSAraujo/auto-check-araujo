import type { OrderListItem } from '../types/orders'
import { ORDEM_STATUS_FILTER_ALL, ORDEM_STATUS_FILTER_ITEMS, type OrdemStatusFilter } from '../utils/order-select-items'

const ORDER_LIST_SELECT = '*, veiculos!inner(id, placa, marca, modelo)'

export async function useOrdersList(initialStatus: OrdemStatusFilter = ORDEM_STATUS_FILTER_ALL) {
  const supabase = useTypedSupabaseClient()
  const router = useRouter()

  const statusFilter = ref<OrdemStatusFilter>(initialStatus)
  const q = ref('')
  const debouncedQ = ref('')
  const { page, pageSize, rangeBounds } = useListPagination([debouncedQ, statusFilter])

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, 300)
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
        // Single round-trip: OR across OS fields + placa via !inner join
        query = query.or(
          `numero.ilike.${pattern},reclamacao.ilike.${pattern},veiculos.placa.ilike.${placa}`
        )
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

  watch(statusFilter, (value) => {
    router.replace({ query: value !== ORDEM_STATUS_FILTER_ALL ? { status: value } : {} })
  })

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
