import type { VeiculoComCliente } from '../utils/vehicle-types'

export async function useVehiclesList() {
  const supabase = useTypedSupabaseClient()

  const q = ref('')
  const debouncedQ = ref('')
  const { page, pageSize, rangeBounds } = useListPagination([debouncedQ])

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, SEARCH_DEBOUNCE_MS)
  })

  const { data, pending } = await useAsyncData(
    'veiculos-list',
    async () => {
      const { from, to } = rangeBounds()
      const raw = debouncedQ.value.trim()
      const pattern = ilikePattern(raw)
      const placaPattern = ilikePattern(normalizePlaca(raw) || raw)

      let query = supabase
        .from('veiculos')
        .select('*, clientes(id, nome)', { count: 'exact' })
        .order('placa', { ascending: true })
        .range(from, to)

      if (pattern) {
        const placa = placaPattern || pattern
        query = query.ilike('placa', placa)
      }

      const { data: rows, count, error } = await query
      if (error) throw error

      return {
        items: (rows || []) as VeiculoComCliente[],
        total: count ?? 0
      }
    },
    { watch: [debouncedQ, page], lazy: true }
  )

  const veiculos = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    q,
    page,
    pageSize,
    total,
    veiculos,
    pending
  }
}
