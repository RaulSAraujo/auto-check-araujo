import type { Checklist } from '~~/shared/types/database'
import type { OrderDetail } from '../types/orders'
import { ORDER_DETAIL_SELECT } from '../utils/order-selects'

export function useOrderQuery(id: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `ordem-${toValue(id)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(ORDER_DETAIL_SELECT)
        .eq('id', toValue(id))
        .single()

      if (error) throw error

      const raw = data as OrderDetail & { checklists: OrderDetail['checklists'] | Checklist[] }
      const checklistRel = Array.isArray(raw.checklists) ? raw.checklists[0] || null : raw.checklists
      return { ...raw, checklists: checklistRel } as OrderDetail
    }
  )
}
