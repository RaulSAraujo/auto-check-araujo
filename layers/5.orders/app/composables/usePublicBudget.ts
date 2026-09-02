import type { OrcamentoStatus } from '~~/shared/types/oficina'

export type PublicBudgetItem = {
  id: string
  tipo: string
  descricao: string
  quantidade: number
  valor_unitario: number
  ordem: number
}

export type PublicBudget = {
  numero: string
  orcamento_status: OrcamentoStatus
  aberta_em: string
  reclamacao: string | null
  km_entrada: number | null
  veiculo: {
    placa: string
    marca: string | null
    modelo: string | null
  }
  cliente: {
    nome: string
  }
  itens: PublicBudgetItem[]
  valor_total: number
}

export function usePublicBudgetQuery(token: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()

  return useAsyncData(
    () => `public-budget-${toValue(token)}`,
    async () => {
      const tokenValue = toValue(token)
      if (!tokenValue) return null

      const { data, error } = await supabase.rpc('get_orcamento_publico', {
        p_token: tokenValue
      })

      if (error) throw error
      return data as PublicBudget
    },
    { watch: [() => toValue(token)] }
  )
}
