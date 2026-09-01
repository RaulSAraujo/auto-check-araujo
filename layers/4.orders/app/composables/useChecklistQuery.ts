import type { ChecklistWithItems } from '../types/orders'
import {
  countFilledChecklistItens,
  groupChecklistItensByCategoria
} from '../utils/checklist'

export function useChecklistQuery(ordemId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  const { data: checklist, pending, refresh } = useAsyncData(
    () => `checklist-os-${toValue(ordemId)}`,
    async () => {
      const { error: rpcError } = await supabase.rpc('criar_checklist_da_os', {
        p_ordem_servico_id: toValue(ordemId)
      })
      if (rpcError) throw rpcError

      const { data, error } = await supabase
        .from('checklists')
        .select('*, checklist_itens(*), ordens_servico(id, numero, status)')
        .eq('ordem_servico_id', toValue(ordemId))
        .single()

      if (error) throw error

      const row = data as ChecklistWithItems
      row.checklist_itens = [...(row.checklist_itens || [])].sort((a, b) => a.ordem - b.ordem)
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
