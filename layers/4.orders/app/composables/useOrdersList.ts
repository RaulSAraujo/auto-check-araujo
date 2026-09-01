import type { OrdemStatus } from '~~/shared/types/oficina'
import type { OrderListItem } from '../types/orders'
import { ORDEM_STATUS_FILTER_ITEMS } from '../utils/order-select-items'

export async function useOrdersList(initialStatus: OrdemStatus | '' = '') {
  const supabase = useTypedSupabaseClient()
  const router = useRouter()

  const statusFilter = ref<OrdemStatus | ''>(initialStatus)
  const q = ref('')
  const debouncedQ = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, 300)
  })

  const { data: ordens, pending } = await useAsyncData(
    'ordens-list',
    async () => {
      let query = supabase
        .from('ordens_servico')
        .select('*, veiculos(id, placa, marca, modelo)')
        .order('aberta_em', { ascending: false })

      if (statusFilter.value) {
        query = query.eq('status', statusFilter.value)
      }

      const { data, error } = await query
      if (error) throw error

      let rows = (data || []) as OrderListItem[]
      const term = debouncedQ.value.trim().toLowerCase()
      if (term) {
        const placaNorm = normalizePlaca(term).toLowerCase()
        rows = rows.filter((o) => {
          const placa = o.veiculos?.placa?.toLowerCase() || ''
          return (
            o.numero.toLowerCase().includes(term)
            || placa.includes(placaNorm || term)
            || (o.reclamacao || '').toLowerCase().includes(term)
          )
        })
      }
      return rows
    },
    { watch: [statusFilter, debouncedQ] }
  )

  watch(statusFilter, (value) => {
    router.replace({ query: value ? { status: value } : {} })
  })

  return {
    q,
    statusFilter,
    statusItems: ORDEM_STATUS_FILTER_ITEMS,
    ordens,
    pending
  }
}
