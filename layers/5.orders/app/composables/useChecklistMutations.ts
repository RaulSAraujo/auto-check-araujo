import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import type { ChecklistWithItems } from '../types/orders'

export function useChecklistMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function saveChecklistItem(item: ChecklistItem, readOnly: boolean) {
    if (readOnly) return { error: null }

    const { error } = await supabase
      .from('checklist_itens')
      .update({
        resultado: item.resultado,
        observacao: item.observacao?.trim() || null
      })
      .eq('id', item.id)

    if (error) {
      toast.add({ title: 'Erro ao salvar item', description: error.message, color: 'error' })
    }

    return { error }
  }

  async function bulkSetResultado(itemIds: string[], resultado: ChecklistResultado) {
    if (itemIds.length === 0) return { error: null }

    const { error } = await supabase
      .from('checklist_itens')
      .update({ resultado })
      .in('id', itemIds)

    if (error) {
      toast.add({ title: 'Erro ao atualizar itens', description: error.message, color: 'error' })
    }

    return { error }
  }

  async function concludeChecklist(checklist: ChecklistWithItems) {
    const pendingItems = checklist.checklist_itens.filter(i => !i.resultado)
    if (pendingItems.length > 0) {
      toast.add({
        title: 'Checklist incompleto',
        description: `Preencha o resultado de todos os itens (${pendingItems.length} pendente(s)).`,
        color: 'warning'
      })
      return { error: null, incomplete: true }
    }

    const { error } = await supabase
      .from('checklists')
      .update({ status: 'concluida' })
      .eq('id', checklist.id)

    if (error) {
      toast.add({ title: 'Erro ao concluir', description: error.message, color: 'error' })
      return { error, incomplete: false }
    }

    toast.add({ title: 'Checklist concluída', color: 'success' })
    return { error: null, incomplete: false }
  }

  return {
    saveChecklistItem,
    bulkSetResultado,
    concludeChecklist
  }
}
