export async function useSchedulingVehicleOptions() {
  const supabase = useTypedSupabaseClient()

  const { data: veiculos } = await useAsyncData('scheduling-veiculos-options', async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa, marca, modelo, clientes(id, nome)')
      .order('placa', { ascending: true })

    if (error) throw error
    return data ?? []
  })

  const veiculoItems = computed(() =>
    (veiculos.value || []).map((v) => {
      const cliente = Array.isArray(v.clientes) ? v.clientes[0] : v.clientes
      return {
        label: `${formatPlaca(v.placa)}${v.marca || v.modelo ? ` — ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : ''}${cliente?.nome ? ` (${cliente.nome})` : ''}`,
        value: v.id
      }
    })
  )

  return { veiculos, veiculoItems }
}
