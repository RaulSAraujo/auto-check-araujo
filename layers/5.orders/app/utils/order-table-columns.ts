import type { TableColumn } from '@nuxt/ui'
import type { OrderListItem } from '../types/orders'

export const ORDER_LIST_COLUMNS: TableColumn<OrderListItem>[] = [
  { accessorKey: 'numero', header: 'Número' },
  { id: 'cliente', header: 'Cliente' },
  { id: 'placa', header: 'Placa' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'pagamento', header: 'Pagamento' },
  { accessorKey: 'aberta_em', header: 'Aberta em' },
  { id: 'actions', header: '' }
]
