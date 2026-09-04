import type { OrderVehicleOption } from '../types/orders'

export interface OrderVehicleSelectItem {
  label: string
  description: string
  value: string
  placa: string
  marca: string | null
  modelo: string | null
  clienteNome: string | null
}

function vehicleDescription(v: OrderVehicleOption): string {
  const vehicle = [v.marca, v.modelo].filter(Boolean).join(' ')
  const cliente = v.clientes?.nome?.trim()
  if (vehicle && cliente) return `${vehicle} · ${cliente}`
  return vehicle || cliente || 'Sem cliente vinculado'
}

function toSelectItem(v: OrderVehicleOption): OrderVehicleSelectItem {
  return {
    label: formatPlaca(v.placa),
    description: vehicleDescription(v),
    value: v.id,
    placa: v.placa,
    marca: v.marca,
    modelo: v.modelo,
    clienteNome: v.clientes?.nome ?? null
  }
}

const VEHICLE_OPTION_SELECT = 'id, placa, marca, modelo, clientes!inner(nome)'

export async function useOrderVehicleOptions(
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

  const { data: veiculos, pending, error, refresh } = await useAsyncData(
    () => `veiculos-options-os-${debouncedSearch.value}`,
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

      const rows = (data || []) as OrderVehicleOption[]

      const preferred = preferredIdRef.value
      if (preferred && !rows.some(row => row.id === preferred)) {
        const { data: extra } = await supabase
          .from('veiculos')
          .select(VEHICLE_OPTION_SELECT)
          .eq('id', preferred)
          .maybeSingle()
        if (extra) rows.unshift(extra as OrderVehicleOption)
      }

      return rows
    },
    { watch: [debouncedSearch, preferredIdRef] }
  )

  const veiculoItems = computed<OrderVehicleSelectItem[]>(() =>
    (veiculos.value || []).map(toSelectItem)
  )

  const veiculoById = computed(() => {
    const map = new Map<string, OrderVehicleSelectItem>()
    for (const item of veiculoItems.value) {
      map.set(item.value, item)
    }
    return map
  })

  function findVehicle(id: string | undefined | null) {
    if (!id) return null
    return veiculoById.value.get(id) ?? null
  }

  return {
    veiculos,
    veiculoItems,
    veiculoById,
    findVehicle,
    searchTerm,
    pending,
    error,
    refresh
  }
}
