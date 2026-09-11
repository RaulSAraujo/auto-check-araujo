export type VehicleOptionRow = {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  clientes: { id: string, nome: string } | { id: string, nome: string }[] | null
}

type SearchVehicleOptionRpcRow = {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  cliente_id: string
  cliente_nome: string
}

function mapRpcRow(row: SearchVehicleOptionRpcRow): VehicleOptionRow {
  return {
    id: row.id,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    clientes: {
      id: row.cliente_id,
      nome: row.cliente_nome
    }
  }
}

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
    }, OPTIONS_SEARCH_DEBOUNCE_MS)
  })

  onUnmounted(() => clearTimeout(debounceTimer))

  const preferredIdRef = computed(() => toValue(options?.preferredId) || '')

  const { data: veiculos, pending, error, refresh } = await useAsyncData(
    key,
    async () => {
      const term = sanitizeIlikeTerm(debouncedSearch.value)
      const preferred = preferredIdRef.value || null

      const { data, error: queryError } = await supabase.rpc('search_vehicle_options', {
        p_search: term || null,
        p_limit: OPTIONS_FETCH_LIMIT,
        p_preferred_id: preferred
      })

      if (queryError) throw queryError

      return (data ?? []).map(mapRpcRow)
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
