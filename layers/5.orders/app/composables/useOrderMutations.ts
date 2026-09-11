import type { OrderEditState, OrderFormState } from '../utils/order-form'
import {
  isOrderFormValid,
  orderEditToUpdate,
  orderFormToInsert
} from '../utils/order-form'
import { canConcludeOrder } from '~~/shared/types/oficina'

export function useOrderMutations() {
  const supabase = useTypedSupabaseClient()
  const userId = useAuthUserId()
  const toast = useToast()

  async function createOrder(state: OrderFormState, options?: { agendamentoId?: string }) {
    if (!isOrderFormValid(state)) {
      toast.add({
        title: 'Falta o veículo',
        description: 'Selecione a placa para abrir a OS.',
        color: 'warning'
      })
      return { data: null, error: null }
    }

    const abertoPor = userId.value
    if (!abertoPor) {
      toast.add({
        title: 'Sessão expirada',
        description: 'Entre de novo e tente abrir a OS.',
        color: 'error'
      })
      return { data: null, error: null }
    }

    const { data, error } = await supabase
      .from('ordens_servico')
      .insert(orderFormToInsert(state, abertoPor))
      .select('id')
      .single()

    if (error) {
      toast.add({
        title: 'Não foi possível abrir a OS',
        description: error.message || 'Tente de novo em instantes.',
        color: 'error'
      })
      return { data: null, error }
    }

    toast.add({ title: 'OS aberta', color: 'success' })

    const agendamentoId = options?.agendamentoId?.trim()
    if (agendamentoId && data.id) {
      const { error: linkError } = await supabase
        .from('agendamentos')
        .update({
          ordem_servico_id: data.id,
          status: 'em_atendimento'
        })
        .eq('id', agendamentoId)
        .is('ordem_servico_id', null)

      if (linkError) {
        toast.add({
          title: 'OS aberta, mas o agendamento não foi vinculado',
          description: linkError.message,
          color: 'warning'
        })
      }
    }

    return { data, error: null }
  }

  async function updateOrder(id: string, state: OrderEditState) {
    if (state.km_entrada != null && state.km_entrada < 0) {
      toast.add({
        title: 'Km inválido',
        description: 'Informe um km de entrada zero ou positivo.',
        color: 'warning'
      })
      return { error: null }
    }

    const { data, error } = await supabase
      .from('ordens_servico')
      .update(orderEditToUpdate(state))
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      toast.add({
        title: 'Não foi possível salvar a OS',
        description: error.message || 'Tente de novo em instantes.',
        color: 'error'
      })
      return { error }
    }

    if (!data) {
      toast.add({
        title: 'Não foi possível salvar a OS',
        description: 'Nenhuma linha atualizada. Verifique permissões ou se a OS ainda existe.',
        color: 'error'
      })
      return { error: new Error('update returned no rows') }
    }

    toast.add({ title: 'OS atualizada', color: 'success' })
    return { error: null }
  }

  async function updateOrderStatus(
    id: string,
    currentStatus: string,
    newStatus: string
  ) {
    if (newStatus === currentStatus) {
      return { error: null, unchanged: true }
    }

    if (newStatus === 'concluida') {
      const { data: order, error: fetchError } = await supabase
        .from('ordens_servico')
        .select('orcamento_status, pago, valor_total')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) {
        toast.add({ title: 'Erro ao atualizar status', description: fetchError.message, color: 'error' })
        return { error: fetchError, unchanged: false }
      }

      if (!order || !canConcludeOrder(order)) {
        const total = Number(order?.valor_total) || 0
        toast.add({
          title: total > 0 && order?.orcamento_status === 'aprovado'
            ? 'Pagamento necessário'
            : 'Orçamento necessário',
          description: total > 0 && order?.orcamento_status === 'aprovado'
            ? 'Registre o pagamento antes de concluir a OS.'
            : 'Aprove o orçamento antes de concluir a OS.',
          color: 'warning'
        })
        return { error: new Error('cannot conclude order'), unchanged: false }
      }
    }

    const patch: { status: string, concluida_em?: string | null } = {
      status: newStatus
    }

    if (newStatus === 'concluida') {
      patch.concluida_em = new Date().toISOString()
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update(patch)
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao atualizar status', description: error.message, color: 'error' })
      return { error, unchanged: false }
    }

    toast.add({ title: 'Status atualizado', color: 'success' })
    return { error: null, unchanged: false }
  }

  return {
    createOrder,
    updateOrder,
    updateOrderStatus
  }
}
