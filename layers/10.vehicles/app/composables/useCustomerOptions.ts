import type { Cliente } from '~~/shared/types/database'

export function useCustomerOptions(
  key = 'clientes-options',
  preferredId?: MaybeRefOrGetter<string | undefined>
) {
  const supabase = useTypedSupabaseClient()
  const searchTerm = ref('')
  const debouncedSearch = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(searchTerm, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearch.value = value
    }, OPTIONS_SEARCH_DEBOUNCE_MS)
  })

  onUnmounted(() => clearTimeout(debounceTimer))

  const preferredIdRef = computed(() => toValue(preferredId) || '')

  const { data: clientes, pending } = useAsyncData(
    () => `${key}-${debouncedSearch.value}`,
    async () => {
      const pattern = ilikePattern(debouncedSearch.value)

      let query = supabase
        .from('clientes')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true })
        .limit(OPTIONS_FETCH_LIMIT)

      if (pattern) {
        query = query.ilike('nome', pattern)
      }

      const { data, error } = await query
      if (error) throw error

      const rows = (data || []) as Pick<Cliente, 'id' | 'nome'>[]
      const preferred = preferredIdRef.value
      if (preferred && !rows.some(row => row.id === preferred)) {
        const { data: extra } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('id', preferred)
          .maybeSingle()
        if (extra) rows.unshift(extra)
      }

      return rows
    },
    { watch: [debouncedSearch, preferredIdRef] }
  )

  const clienteItems = computed(() =>
    (clientes.value || []).map(c => ({
      label: c.nome,
      value: c.id
    }))
  )

  return {
    clientes,
    clienteItems,
    searchTerm,
    pending
  }
}
