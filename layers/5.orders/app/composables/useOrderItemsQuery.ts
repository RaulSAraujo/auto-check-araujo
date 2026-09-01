import type { OrdemItem } from '~~/shared/types/database'

export function useOrderItemsQuery(orderId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `ordem-itens-${toValue(orderId)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordem_itens')
        .select('*')
        .eq('ordem_servico_id', toValue(orderId))
        .order('ordem')

      if (error) throw error
      return data as OrdemItem[]
    }
  )
}
