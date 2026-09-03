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
      return { error }
    }

    return { error: null }
  }

  async function bulkSetResultado(
    itemIds: string[],
    resultado: ChecklistResultado,
    options?: { clearObservacao?: boolean }
  ) {
    if (itemIds.length === 0) return { error: null }

    const payload: { resultado: ChecklistResultado, observacao?: null } = { resultado }
    if (options?.clearObservacao) {
      payload.observacao = null
    }

    const { error } = await supabase
      .from('checklist_itens')
      .update(payload)
      .in('id', itemIds)

    if (error) {
      toast.add({ title: 'Erro ao atualizar itens', description: error.message, color: 'error' })
    }

    return { error }
  }

  async function addChecklistItem(
    checklistId: string,
    draft: { categoria: string, label: string },
    ordem: number
  ) {
    const { data, error } = await supabase
      .from('checklist_itens')
      .insert({
        checklist_id: checklistId,
        categoria: draft.categoria.trim(),
        label: draft.label.trim(),
        ordem
      })
      .select('id, checklist_id, categoria, label, ordem, resultado, observacao')
      .single()

    if (error) {
      toast.add({ title: 'Erro ao adicionar item', description: error.message, color: 'error' })
    }

    return { data, error }
  }

  async function deleteChecklistItem(itemId: string) {
    const { error } = await supabase
      .from('checklist_itens')
      .delete()
      .eq('id', itemId)

    if (error) {
      toast.add({ title: 'Erro ao remover item', description: error.message, color: 'error' })
    }

    return { error }
  }

  async function concludeChecklist(checklist: ChecklistWithItems) {
    if (checklist.checklist_itens.length === 0) {
      toast.add({
        title: 'Checklist vazio',
        description: 'Adicione ao menos um item antes de concluir.',
        color: 'warning'
      })
      return { error: null, incomplete: true }
    }

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
    addChecklistItem,
    deleteChecklistItem,
    concludeChecklist
  }
}
