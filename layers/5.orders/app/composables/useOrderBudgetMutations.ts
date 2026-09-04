import type { OrdemItemInsert } from '~~/shared/types/database'
import type { OrcamentoStatus, OrdemItemTipo } from '~~/shared/types/oficina'
import type { OrderItemDraft } from '../utils/budget'
import { isOrderItemDraftValid } from '../utils/budget'

export function useOrderBudgetMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function addOrderItem(
    orderId: string,
    draft: OrderItemDraft,
    nextOrdem: number,
    options?: { silent?: boolean }
  ) {
    if (!isOrderItemDraftValid(draft)) {
      if (!options?.silent) {
        toast.add({ title: 'Preencha a descrição e os valores', color: 'warning' })
      }
      return { error: null }
    }

    const row: OrdemItemInsert = {
      ordem_servico_id: orderId,
      tipo: draft.tipo,
      descricao: draft.descricao.trim(),
      quantidade: draft.quantidade,
      valor_unitario: draft.valor_unitario,
      ordem: nextOrdem
    }

    const { error } = await supabase.from('ordem_itens').insert(row)

    if (error) {
      toast.add({ title: 'Erro ao adicionar item', description: error.message, color: 'error' })
      return { error }
    }

    if (!options?.silent) {
      toast.add({ title: 'Item adicionado', color: 'success' })
    }
    return { error: null }
  }

  async function updateOrderItem(
    itemId: string,
    patch: Partial<Pick<OrderItemDraft, 'descricao' | 'quantidade' | 'valor_unitario' | 'tipo'>>
  ) {
    const { error } = await supabase
      .from('ordem_itens')
      .update(patch)
      .eq('id', itemId)

    if (error) {
      toast.add({ title: 'Erro ao atualizar item', description: error.message, color: 'error' })
      return { error }
    }

    return { error: null }
  }

  async function deleteOrderItem(itemId: string, options?: { silent?: boolean }) {
    const { error } = await supabase
      .from('ordem_itens')
      .delete()
      .eq('id', itemId)

    if (error) {
      toast.add({ title: 'Erro ao remover item', description: error.message, color: 'error' })
      return { error }
    }

    if (!options?.silent) {
      toast.add({ title: 'Item removido', color: 'success' })
    }
    return { error: null }
  }

  async function updateBudgetStatus(orderId: string, status: OrcamentoStatus) {
    const { error } = await supabase
      .from('ordens_servico')
      .update({ orcamento_status: status })
      .eq('id', orderId)

    if (error) {
      toast.add({ title: 'Erro ao atualizar orçamento', description: error.message, color: 'error' })
      return { error }
    }

    const labels: Record<OrcamentoStatus, string> = {
      rascunho: 'Voltou para pré-orçamento',
      aguardando_aprovacao: 'Orçamento enviado para aprovação',
      aprovado: 'Orçamento aprovado',
      rejeitado: 'Orçamento rejeitado'
    }

    toast.add({ title: labels[status], color: 'success' })
    return { error: null }
  }

  return {
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    updateBudgetStatus
  }
}

export type { OrdemItemTipo }
