import type { VeiculoComCliente } from '../utils/vehicle-types'

export function useVehiclesList() {
  const supabase = useTypedSupabaseClient()

  const q = ref('')
  const debouncedQ = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, 300)
  })

  const { data: veiculos, pending } = useAsyncData(
    'veiculos-list',
    async () => {
      let query = supabase
        .from('veiculos')
        .select('*, clientes(id, nome)')
        .order('placa', { ascending: true })

      const term = normalizePlaca(debouncedQ.value.trim()) || debouncedQ.value.trim()
      if (term) {
        const raw = debouncedQ.value.trim()
        query = query.or(`placa.ilike.%${normalizePlaca(raw) || raw}%,marca.ilike.%${raw}%,modelo.ilike.%${raw}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as VeiculoComCliente[]
    },
    { watch: [debouncedQ] }
  )

  return {
    q,
    veiculos,
    pending
  }
}
