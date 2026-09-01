export function useColaboradorNome() {
  const { profile } = useProfile()
  const user = useSupabaseUser()

  const nome = computed(() => {
    const email = typeof user.value?.email === 'string' ? user.value.email : undefined
    return profile.value?.nome || email?.split('@')[0] || 'Colaborador'
  })

  return { nome }
}
