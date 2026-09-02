import type { AgendamentoInsert, AgendamentoUpdate } from '~~/shared/types/database'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  combineLocalDateTime,
  type AppointmentDraft
} from '../utils/scheduling'

export function useSchedulingMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()
  const user = useSupabaseUser()

  async function resolveClienteId(veiculoId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('veiculos')
      .select('cliente_id')
      .eq('id', veiculoId)
      .maybeSingle()

    if (error) {
      toast.add({ title: 'Não foi possível carregar o veículo', description: error.message, color: 'error' })
      return null
    }
    return data?.cliente_id ?? null
  }

  async function createAppointment(draft: AppointmentDraft) {
    if (!draft.veiculo_id) {
      toast.add({ title: 'Selecione o veículo', color: 'error' })
      return { error: new Error('veiculo_id required') }
    }

    const clienteId = await resolveClienteId(draft.veiculo_id)
    if (!clienteId) {
      toast.add({ title: 'Veículo sem cliente vinculado', color: 'error' })
      return { error: new Error('cliente_id missing') }
    }

    const inicio = combineLocalDateTime(draft.date, draft.startTime)
    const fim = combineLocalDateTime(draft.date, draft.endTime)
    if (!(fim > inicio)) {
      toast.add({ title: 'Horário inválido', description: 'O fim deve ser depois do início.', color: 'error' })
      return { error: new Error('invalid range') }
    }

    const payload: AgendamentoInsert = {
      cliente_id: clienteId,
      veiculo_id: draft.veiculo_id,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      status: draft.status,
      servico: draft.servico.trim() || null,
      patio_vaga: draft.patio_vaga,
      observacoes: draft.observacoes.trim() || null,
      criado_por: user.value?.id ?? null
    }

    const { error } = await supabase.from('agendamentos').insert(payload)
    if (error) {
      toast.add({ title: 'Não foi possível criar o agendamento', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Agendamento criado', color: 'success' })
    return { error: null }
  }

  async function updateAppointmentStatus(id: string, status: AgendamentoStatus) {
    const payload: AgendamentoUpdate = { status }
    const { error } = await supabase.from('agendamentos').update(payload).eq('id', id)
    if (error) {
      toast.add({ title: 'Não foi possível atualizar o status', description: error.message, color: 'error' })
      return { error }
    }
    toast.add({ title: 'Status atualizado', color: 'success' })
    return { error: null }
  }

  async function markNoShow(id: string) {
    return updateAppointmentStatus(id, 'nao_compareceu')
  }

  async function markHandledNoShow(id: string) {
    return updateAppointmentStatus(id, 'cancelado')
  }

  return {
    createAppointment,
    updateAppointmentStatus,
    markNoShow,
    markHandledNoShow
  }
}
