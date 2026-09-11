export type VehicleOptionRow = {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  clientes: { id: string, nome: string } | { id: string, nome: string }[] | null
}

const VEHICLE_OPTION_SELECT = 'id, placa, marca, modelo, clientes!inner(id, nome)'

export async function useVehicleOptions(options?: {
  preferredId?: MaybeRefOrGetter<string | undefined>
  key?: string
}) {
  const supabase = useTypedSupabaseClient()
  const key = options?.key ?? 'veiculos-options'
  const searchTerm = ref('')
  const debouncedSearch = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(searchTerm, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearch.value = value
    }, 200)
  })

  const preferredIdRef = computed(() => toValue(options?.preferredId) || '')

  const { data: veiculos, pending, error, refresh } = await useAsyncData(
    () => `${key}-${debouncedSearch.value}`,
    async () => {
      const pattern = ilikePattern(debouncedSearch.value)
      const placaPattern = ilikePattern(
        normalizePlaca(debouncedSearch.value) || debouncedSearch.value
      )

      let query = supabase
        .from('veiculos')
        .select(VEHICLE_OPTION_SELECT)
        .order('placa', { ascending: true })
        .limit(OPTIONS_FETCH_LIMIT)

      if (pattern) {
        const placa = placaPattern || pattern
        query = query.or(
          `placa.ilike.${placa},marca.ilike.${pattern},modelo.ilike.${pattern},clientes.nome.ilike.${pattern}`
        )
      }

      const { data, error: queryError } = await query
      if (queryError) throw queryError

      const rows = (data || []) as VehicleOptionRow[]
      const preferred = preferredIdRef.value
      if (preferred && !rows.some(row => row.id === preferred)) {
        const { data: extra } = await supabase
          .from('veiculos')
          .select(VEHICLE_OPTION_SELECT)
          .eq('id', preferred)
          .maybeSingle()
        if (extra) rows.unshift(extra as VehicleOptionRow)
      }

      return rows
    },
    { watch: [debouncedSearch, preferredIdRef] }
  )

  return {
    veiculos,
    searchTerm,
    pending,
    error,
    refresh
  }
}

export function vehicleOptionClienteNome(row: VehicleOptionRow): string | null {
  const cliente = Array.isArray(row.clientes) ? row.clientes[0] : row.clientes
  return cliente?.nome?.trim() || null
}
