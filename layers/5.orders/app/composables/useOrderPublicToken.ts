export function useOrderPublicToken() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function ensureToken(orderId: string, existing?: string | null): Promise<string | null> {
    if (existing) return existing

    const { data, error } = await supabase.rpc('gerar_orcamento_public_token', {
      p_ordem_id: orderId
    })

    if (error) {
      toast.add({
        title: 'Erro ao gerar link público',
        description: error.message,
        color: 'error'
      })
      return null
    }

    return data as string
  }

  return { ensureToken }
}
