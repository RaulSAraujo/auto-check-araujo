import type { OrdemStatus } from '~~/shared/types/oficina'
import type { PermissionAction } from '../utils/permissions'
import { can, canChangeOrderStatus } from '../utils/permissions'

export function usePermissions() {
  const { papel, pending } = useProfile()

  function check(action: PermissionAction): boolean {
    return can(papel.value, action)
  }

  function checkOrderStatusChange(from: OrdemStatus, to: OrdemStatus): boolean {
    return canChangeOrderStatus(papel.value, from, to)
  }

  return {
    papel,
    pending,
    can: check,
    canChangeOrderStatus: checkOrderStatusChange
  }
}
