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

      const raw = data as OrderDetail
      const appointmentsRel = Array.isArray(raw.agendamentos)
        ? raw.agendamentos
        : raw.agendamentos
          ? [raw.agendamentos]
          : []
      return { ...raw, agendamentos: appointmentsRel } as OrderDetail
    },
    { lazy: true }
  )
}
