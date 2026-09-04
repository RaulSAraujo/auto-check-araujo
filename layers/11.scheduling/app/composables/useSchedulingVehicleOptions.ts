export async function useSchedulingVehicleOptions(
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
    }, 200)
  })

  const preferredIdRef = computed(() => toValue(preferredId) || '')

  const { data: veiculos, pending } = await useAsyncData(
    () => `scheduling-veiculos-options-${debouncedSearch.value}`,
    async () => {
      const pattern = ilikePattern(debouncedSearch.value)
      const placaPattern = ilikePattern(
        normalizePlaca(debouncedSearch.value) || debouncedSearch.value
      )

      let query = supabase
        .from('veiculos')
        .select('id, placa, marca, modelo, clientes!inner(id, nome)')
        .order('placa', { ascending: true })
        .limit(OPTIONS_FETCH_LIMIT)

      if (pattern) {
        const placa = placaPattern || pattern
        query = query.or(
          `placa.ilike.${placa},marca.ilike.${pattern},modelo.ilike.${pattern},clientes.nome.ilike.${pattern}`
        )
      }

      const { data, error } = await query
      if (error) throw error

      const rows = data ?? []
      const preferred = preferredIdRef.value
      if (preferred && !rows.some(row => row.id === preferred)) {
        const { data: extra } = await supabase
          .from('veiculos')
          .select('id, placa, marca, modelo, clientes!inner(id, nome)')
          .eq('id', preferred)
          .maybeSingle()
        if (extra) rows.unshift(extra)
      }

      return rows
    },
    { watch: [debouncedSearch, preferredIdRef] }
  )

  const veiculoItems = computed(() =>
    (veiculos.value || []).map((v) => {
      const cliente = Array.isArray(v.clientes) ? v.clientes[0] : v.clientes
      return {
        label: `${formatPlaca(v.placa)}${v.marca || v.modelo ? ` — ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : ''}${cliente?.nome ? ` (${cliente.nome})` : ''}`,
        value: v.id
      }
    })
  )

  return { veiculos, veiculoItems, searchTerm, pending }
}
