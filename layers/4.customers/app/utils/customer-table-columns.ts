import type { TableColumn } from '@nuxt/ui'
import type { Cliente, OrdemServico, Veiculo } from '~~/shared/types/database'

export type CustomerOrderItem = OrdemServico & {
  veiculos: { id: string, placa: string, cliente_id: string } | null
}

export const CUSTOMER_LIST_COLUMNS: TableColumn<Cliente>[] = [
  { accessorKey: 'nome', header: 'Nome' },
  { id: 'telefones', header: 'Telefones' },
  { id: 'emails', header: 'E-mails' },
  { accessorKey: 'documento', header: 'Documento' },
  { id: 'ativo', header: 'Status' },
  { id: 'actions', header: '' }
]

export const CUSTOMER_VEHICLE_COLUMNS: TableColumn<Veiculo>[] = [
  { accessorKey: 'placa', header: 'Placa' },
  { accessorKey: 'marca', header: 'Marca' },
  { accessorKey: 'modelo', header: 'Modelo' },
  { accessorKey: 'ano', header: 'Ano' },
  { id: 'actions', header: '' }
]

export const CUSTOMER_ORDER_COLUMNS: TableColumn<CustomerOrderItem>[] = [
  { accessorKey: 'numero', header: 'Número' },
  { id: 'placa', header: 'Placa' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'aberta_em', header: 'Aberta em' },
  { id: 'actions', header: '' }
]
