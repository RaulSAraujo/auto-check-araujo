export function useColaboradorNome() {
  const user = useSupabaseUser()
  const userId = useAuthUserId()
  const supabase = useTypedSupabaseClient()
  const nome = ref('Colaborador')

  watchEffect(async () => {
    const id = userId.value
    if (!id) {
      nome.value = 'Colaborador'
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', id)
      .maybeSingle()

    const email = typeof user.value?.email === 'string' ? user.value.email : undefined
    nome.value = data?.nome || email?.split('@')[0] || 'Colaborador'
  })

  return { nome }
}
