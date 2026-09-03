import type { OrderEditState, OrderFormState } from '../utils/order-form'
import {
  isOrderFormValid,
  orderEditToUpdate,
  orderFormToInsert
} from '../utils/order-form'
import { ORDER_ROUTES } from '../utils/order-routes'

export function useOrderMutations() {
  const supabase = useTypedSupabaseClient()
  const userId = useAuthUserId()
  const toast = useToast()

  async function createOrder(state: OrderFormState) {
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
    return { data, error: null }
  }

  async function updateOrder(id: string, state: OrderEditState) {
    if (state.km_entrada != null && state.km_entrada < 0) {
      toast.add({ title: 'Km de entrada inválido', color: 'warning' })
      return { error: null }
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update(orderEditToUpdate(state))
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar OS', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Ordem de Serviço atualizada', color: 'success' })
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

    const patch: { status: string, concluida_em?: string | null } = {
      status: newStatus
    }

    if (newStatus === 'concluida') {
      patch.concluida_em = new Date().toISOString()
    } else if (currentStatus === 'concluida' || newStatus === 'retrabalho') {
      patch.concluida_em = null
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

  async function startChecklist(ordemId: string) {
    const { data, error } = await supabase.rpc('criar_checklist_da_os', {
      p_ordem_servico_id: ordemId
    })

    if (error) {
      toast.add({ title: 'Erro ao criar Checklist', description: error.message, color: 'error' })
      return { data: null, error }
    }

    await navigateTo(ORDER_ROUTES.checklist(ordemId))
    return { data, error: null }
  }

  return {
    createOrder,
    updateOrder,
    updateOrderStatus,
    startChecklist
  }
}
