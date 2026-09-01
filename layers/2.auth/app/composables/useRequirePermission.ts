import type { PermissionAction } from '../utils/permissions'

export function useRequirePermission(action: PermissionAction) {
  const { can, pending, papel } = usePermissions()
  const toast = useToast()

  watch(
    [pending, papel],
    () => {
      if (pending.value) return
      if (!can(action)) {
        toast.add({
          title: 'Sem permissão',
          description: 'Você não tem acesso a esta página.',
          color: 'error'
        })
        navigateTo(APP_ROUTES.home)
      }
    },
    { immediate: true }
  )
}
