import type { ChecklistWithItems } from '../types/orders'
import {
  countFilledChecklistItens,
  groupChecklistItensByCategoria
} from '../utils/checklist'
import { CHECKLIST_DETAIL_SELECT } from '../utils/order-selects'

export function useChecklistQuery(ordemId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  const { data: checklist, pending, refresh } = useAsyncData(
    () => `checklist-os-${toValue(ordemId)}`,
    async () => {
      const id = toValue(ordemId)

      // Lê primeiro (índice único em ordem_servico_id). RPC só se ainda não existir.
      let { data, error } = await supabase
        .from('checklists')
        .select(CHECKLIST_DETAIL_SELECT)
        .eq('ordem_servico_id', id)
        .order('ordem', { referencedTable: 'checklist_itens' })
        .maybeSingle()

      if (error) throw error

      if (!data) {
        const { error: rpcError } = await supabase.rpc('criar_checklist_da_os', {
          p_ordem_servico_id: id
        })
        if (rpcError) throw rpcError

        const created = await supabase
          .from('checklists')
          .select(CHECKLIST_DETAIL_SELECT)
          .eq('ordem_servico_id', id)
          .order('ordem', { referencedTable: 'checklist_itens' })
          .single()

        if (created.error) throw created.error
        data = created.data
      }

      const row = data as ChecklistWithItems
      row.checklist_itens = row.checklist_itens || []
      return row
    }
  )

  const itensByCategoria = computed(() =>
    groupChecklistItensByCategoria(checklist.value?.checklist_itens || [])
  )

  const filledCount = computed(() =>
    countFilledChecklistItens(checklist.value?.checklist_itens || [])
  )

  const totalCount = computed(() => checklist.value?.checklist_itens?.length || 0)

  const readOnly = computed(() => checklist.value?.status === 'concluida')

  return {
    checklist,
    pending,
    refresh,
    itensByCategoria,
    filledCount,
    totalCount,
    readOnly
  }
}
