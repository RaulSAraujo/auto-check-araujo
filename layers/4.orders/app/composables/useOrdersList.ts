import type { OrdemStatus } from '~~/shared/types/oficina'
import type { OrderListItem } from '../types/orders'
import { ORDEM_STATUS_FILTER_ITEMS } from '../utils/order-select-items'
import { ilikePattern } from '~/utils/supabase-search'

export async function useOrdersList(initialStatus: OrdemStatus | '' = '') {
  const supabase = useTypedSupabaseClient()
  const router = useRouter()

  const statusFilter = ref<OrdemStatus | ''>(initialStatus)
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
        .select('*, veiculos(id, placa, marca, modelo)', { count: 'exact' })
        .order('aberta_em', { ascending: false })
        .range(from, to)

      if (statusFilter.value) {
        query = query.eq('status', statusFilter.value)
      }

      if (pattern) {
        const placa = placaPattern || pattern
        const { data: matchedVeiculos } = await supabase
          .from('veiculos')
          .select('id')
          .ilike('placa', placa)

        const veiculoIds = matchedVeiculos?.map(v => v.id) ?? []
        let orFilter = `numero.ilike.${pattern},reclamacao.ilike.${pattern}`
        if (veiculoIds.length > 0) {
          orFilter += `,veiculo_id.in.(${veiculoIds.join(',')})`
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
    { watch: [statusFilter, debouncedQ, page] }
  )

  watch(statusFilter, (value) => {
    router.replace({ query: value ? { status: value } : {} })
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
