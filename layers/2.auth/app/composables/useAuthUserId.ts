/** ID do colaborador autenticado (claim JWT `sub`). */
export function useAuthUserId() {
  const user = useSupabaseUser()

  return computed(() => user.value?.sub ?? null)
}
