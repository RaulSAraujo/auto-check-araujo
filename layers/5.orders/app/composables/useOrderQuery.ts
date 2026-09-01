import type { Checklist } from '~~/shared/types/database'
import type { OrderDetail } from '../types/orders'

export function useOrderQuery(id: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `ordem-${toValue(id)}`,
    async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, veiculos(id, placa, marca, modelo, clientes(id, nome)), profiles!ordens_servico_aberto_por_fkey(nome), checklists(id, status)')
        .eq('id', toValue(id))
        .single()

      if (error) throw error

      const raw = data as OrderDetail & { checklists: OrderDetail['checklists'] | Checklist[] }
      const checklistRel = Array.isArray(raw.checklists) ? raw.checklists[0] || null : raw.checklists
      return { ...raw, checklists: checklistRel } as OrderDetail
    }
  )
}
