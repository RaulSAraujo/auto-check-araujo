import type { OrderVehicleOption } from '../types/orders'
import {
  useVehicleOptions,
  type VehicleOptionRow
} from '#layers/vehicles/app/composables/useVehicleOptions'

export interface OrderVehicleSelectItem {
  label: string
  description: string
  value: string
  placa: string
  marca: string | null
  modelo: string | null
  clienteNome: string | null
}

function toOrderVehicleOption(row: VehicleOptionRow): OrderVehicleOption {
  const cliente = Array.isArray(row.clientes) ? row.clientes[0] : row.clientes
  return {
    id: row.id,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    clientes: cliente ? { nome: cliente.nome } : null
  }
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

export async function useOrderVehicleOptions(
  preferredId?: MaybeRefOrGetter<string | undefined>
) {
  const { veiculos: raw, searchTerm, pending, error, refresh } = await useVehicleOptions({
    preferredId,
    key: 'veiculos-options-os'
  })

  const veiculos = computed(() =>
    (raw.value || []).map(toOrderVehicleOption)
  )

  const veiculoItems = computed<OrderVehicleSelectItem[]>(() =>
    veiculos.value.map(toSelectItem)
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
