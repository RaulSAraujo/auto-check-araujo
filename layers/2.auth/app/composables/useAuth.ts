import { AUTH_ROUTES } from '../utils/auth-routes'

export function useAuth() {
  const user = useSupabaseUser()
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      toast.add({
        title: 'Falha no login',
        description: error.message,
        color: 'error'
      })
    }

    return { error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.add({
        title: 'Erro ao sair',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    await navigateTo(AUTH_ROUTES.login)
    return { error: null }
  }

  return {
    user,
    signInWithPassword,
    signOut
  }
}
