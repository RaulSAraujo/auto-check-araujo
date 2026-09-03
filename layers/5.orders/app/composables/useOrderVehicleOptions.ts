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

export async function useOrderVehicleOptions() {
  const supabase = useTypedSupabaseClient()

  const { data: veiculos, pending, error, refresh } = await useAsyncData('veiculos-options-os', async () => {
    const { data, error: queryError } = await supabase
      .from('veiculos')
      .select('id, placa, marca, modelo, clientes(nome)')
      .order('placa', { ascending: true })

    if (queryError) throw queryError
    return data as OrderVehicleOption[]
  })

  const veiculoItems = computed<OrderVehicleSelectItem[]>(() =>
    (veiculos.value || []).map(v => ({
      label: formatPlaca(v.placa),
      description: vehicleDescription(v),
      value: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      clienteNome: v.clientes?.nome ?? null
    }))
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

  return { veiculos, veiculoItems, veiculoById, findVehicle, pending, error, refresh }
}
