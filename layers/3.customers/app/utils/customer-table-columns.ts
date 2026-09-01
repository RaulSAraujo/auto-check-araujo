import type { TableColumn } from '@nuxt/ui'
import type { Cliente, Veiculo } from '~~/shared/types/database'

export const CUSTOMER_LIST_COLUMNS: TableColumn<Cliente>[] = [
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'telefone', header: 'Telefone' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'documento', header: 'Documento' },
  { id: 'actions', header: '' }
]

export const CUSTOMER_VEHICLE_COLUMNS: TableColumn<Veiculo>[] = [
  { accessorKey: 'placa', header: 'Placa' },
  { accessorKey: 'marca', header: 'Marca' },
  { accessorKey: 'modelo', header: 'Modelo' },
  { accessorKey: 'ano', header: 'Ano' },
  { id: 'actions', header: '' }
]
