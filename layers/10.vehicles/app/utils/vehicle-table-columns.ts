import type { TableColumn } from '@nuxt/ui'
import type { OrdemServico } from '~~/shared/types/database'
import type { VeiculoComCliente } from './vehicle-types'

export const VEHICLE_LIST_COLUMNS: TableColumn<VeiculoComCliente>[] = [
  { accessorKey: 'placa', header: 'Placa' },
  { accessorKey: 'marca', header: 'Marca' },
  { accessorKey: 'modelo', header: 'Modelo' },
  { accessorKey: 'ano', header: 'Ano' },
  { accessorKey: 'cor', header: 'Cor' },
  { accessorKey: 'km_atual', header: 'KM Atual' },
  { id: 'cliente', header: 'Proprietário' },
  { id: 'actions', header: '' }
]

export const VEHICLE_ORDER_COLUMNS: TableColumn<OrdemServico>[] = [
  { accessorKey: 'numero', header: 'Número' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'aberta_em', header: 'Aberta em' },
  { id: 'actions', header: '' }
]
