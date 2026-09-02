import { AUTH_ROUTES } from '../utils/auth-routes'
import { usernameToAuthEmail } from '~~/shared/utils/username'

export function useAuth() {
  const user = useSupabaseUser()
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function signInWithPassword(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password
    })

    if (error) {
      toast.add({
        title: 'Não foi possível entrar',
        description: 'Usuário ou senha incorretos. Tente de novo.',
        color: 'error'
      })
    }

    return { error }
  }

  async function signOut() {
    const session = useSupabaseSession()
    const redirectInfo = useSupabaseCookieRedirect()

    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.add({
        title: 'Erro ao sair',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    // Limpa estado antes do redirect para evitar loop com login.vue
    session.value = null
    user.value = null
    redirectInfo.pluck()

    await navigateTo(AUTH_ROUTES.login, { replace: true })
    return { error: null }
  }

  return {
    user,
    signInWithPassword,
    signOut
  }
}
