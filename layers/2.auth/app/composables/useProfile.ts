import type { ColaboradorPapel } from '~~/shared/types/oficina'

export function useProfile() {
  const userId = useAuthUserId()
  const supabase = useTypedSupabaseClient()

  const { data: profile, pending, refresh } = useAsyncData(
    'colaborador-profile',
    async () => {
      const id = userId.value
      if (!id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, username, papel')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return data
    },
    { watch: [userId], lazy: true }
  )

  const papel = computed(() => (profile.value?.papel || 'recepcao') as ColaboradorPapel)

  return {
    profile,
    papel,
    pending,
    refresh
  }
}
