export function useColaboradorNome() {
  const user = useSupabaseUser()
  const supabase = useTypedSupabaseClient()
  const nome = ref('Colaborador')

  watchEffect(async () => {
    if (!user.value?.id) {
      nome.value = 'Colaborador'
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', user.value.id)
      .maybeSingle()

    nome.value = data?.nome || user.value.email?.split('@')[0] || 'Colaborador'
  })

  return { nome }
}
