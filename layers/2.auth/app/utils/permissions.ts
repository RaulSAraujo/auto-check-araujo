import type { ColaboradorPapel, OrdemStatus } from '~~/shared/types/oficina'

export type PermissionAction
  = | 'customers.write'
    | 'customers.delete'
    | 'vehicles.write'
    | 'vehicles.delete'
    | 'orders.create'
    | 'orders.edit'
    | 'budget.edit'
    | 'budget.approve'
    | 'finance.view'
    | 'catalog.manage'
    | 'scheduling.write'
    | 'collaborators.manage'

export function can(papel: ColaboradorPapel, action: PermissionAction): boolean {
  switch (action) {
    case 'customers.write':
    case 'vehicles.write':
    case 'orders.create':
    case 'orders.edit':
    case 'budget.edit':
    case 'budget.approve':
    case 'scheduling.write':
      return papel === 'recepcao' || papel === 'gerente'

    case 'customers.delete':
    case 'vehicles.delete':
    case 'finance.view':
    case 'catalog.manage':
    case 'collaborators.manage':
      return papel === 'gerente'

    default:
      return false
  }
}

export function canChangeOrderStatus(
  papel: ColaboradorPapel,
  from: OrdemStatus,
  to: OrdemStatus
): boolean {
  if (from === to) return true
  // OS concluída é definitiva — sem mudança de status
  if (from === 'concluida') return false
  if (papel === 'gerente' || papel === 'recepcao') return true
  return from === 'em_andamento' && to === 'concluida'
}
