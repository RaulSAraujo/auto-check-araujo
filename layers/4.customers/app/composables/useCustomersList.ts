import type { Cliente } from '~~/shared/types/database'
import {
  CUSTOMER_STATUS_FILTER_ACTIVE,
  CUSTOMER_STATUS_FILTER_INACTIVE,
  CUSTOMER_STATUS_FILTER_ITEMS,
  type CustomerStatusFilter
} from '../utils/customer-status'

export async function useCustomersList() {
  const supabase = useTypedSupabaseClient()

  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
  const statusFilter = useRouteQueryState<CustomerStatusFilter>('status', CUSTOMER_STATUS_FILTER_ACTIVE, CUSTOMER_STATUS_FILTER_ITEMS.map(item => item.value))
  const { page, pageSize, rangeBounds } = useListPagination([debouncedQ, statusFilter])

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, SEARCH_DEBOUNCE_MS)
  })

  const { data, pending } = await useAsyncData(
    'clientes-list',
    async () => {
      const { from, to } = rangeBounds()
      const pattern = ilikePattern(debouncedQ.value)

      let query = supabase
        .from('clientes')
        .select('id, nome, documento, telefones, emails, ativo, contatos_busca', { count: 'exact' })
        .order('nome', { ascending: true })
        .range(from, to)

      if (statusFilter.value === CUSTOMER_STATUS_FILTER_ACTIVE) {
        query = query.eq('ativo', true)
      } else if (statusFilter.value === CUSTOMER_STATUS_FILTER_INACTIVE) {
        query = query.eq('ativo', false)
      }

      if (pattern) {
        query = query.or(
          `nome.ilike.${pattern},documento.ilike.${pattern},contatos_busca.ilike.${pattern}`
        )
      }

      const { data: rows, count, error } = await query
      if (error) throw error

      return {
        items: (rows || []) as Cliente[],
        total: count ?? 0
      }
    },
    { watch: [debouncedQ, page, statusFilter], lazy: true }
  )

  const clientes = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    q,
    page,
    pageSize,
    total,
    statusFilter,
    statusItems: CUSTOMER_STATUS_FILTER_ITEMS,
    clientes,
    pending
  }
}
