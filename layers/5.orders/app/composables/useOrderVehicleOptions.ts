import type { OrderVehicleOption } from '../types/orders'

export async function useOrderVehicleOptions() {
  const supabase = useTypedSupabaseClient()

  const { data: veiculos } = await useAsyncData('veiculos-options-os', async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa, marca, modelo, clientes(nome)')
      .order('placa', { ascending: true })

    if (error) throw error
    return data as OrderVehicleOption[]
  })

  const veiculoItems = computed(() =>
    (veiculos.value || []).map(v => ({
      label: `${formatPlaca(v.placa)}${v.marca || v.modelo ? ` — ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : ''}${v.clientes?.nome ? ` (${v.clientes.nome})` : ''}`,
      value: v.id
    }))
  )

  return { veiculos, veiculoItems }
}
