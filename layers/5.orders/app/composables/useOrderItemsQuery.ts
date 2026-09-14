import type { OrdemItem } from '~~/shared/types/database'
import { ORDER_ITEM_SELECT } from '../utils/order-selects'

export function useOrderItemsQuery(orderId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `ordem-itens-${toValue(orderId)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordem_itens')
        .select(ORDER_ITEM_SELECT)
        .eq('ordem_servico_id', toValue(orderId))
        .order('ordem')

      if (error) throw error
      return data as unknown as OrdemItem[]
    },
    { lazy: true }
  )
}
