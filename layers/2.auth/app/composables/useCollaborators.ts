import type { ColaboradorPapel } from '~~/shared/types/oficina'

export type CollaboratorRow = {
  id: string
  nome: string
  papel: ColaboradorPapel
  username: string
  created_at: string
}

export function useCollaboratorsList() {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    'collaborators-list',
    async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('list_colaboradores')
      if (rpcError) throw rpcError
      return (rows || []) as CollaboratorRow[]
    }
  )

  return {
    collaborators: data,
    pending,
    refresh,
    error
  }
}

export function useCollaboratorMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function updatePapel(id: string, papel: ColaboradorPapel) {
    const { error } = await supabase.rpc('update_colaborador_papel', {
      p_user_id: id,
      p_papel: papel
    })

    if (error) {
      toast.add({
        title: 'Erro ao atualizar papel',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({ title: 'Papel atualizado', color: 'success' })
    return { error: null }
  }

  async function createCollaborator(payload: {
    username: string
    password: string
    nome: string
    papel: ColaboradorPapel
  }) {
    try {
      await $fetch('/api/collaborators/create', {
        method: 'POST',
        body: payload
      })
      toast.add({
        title: 'Colaborador criado',
        description: `Usuário ${payload.username} criado com sucesso`,
        color: 'success'
      })
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (err as { data?: { message?: string } })?.data?.message || 'Erro ao criar colaborador'
      toast.add({
        title: 'Erro ao criar colaborador',
        description: message,
        color: 'error'
      })
      return { error: err }
    }
  }

  return {
    updatePapel,
    createCollaborator
  }
}
