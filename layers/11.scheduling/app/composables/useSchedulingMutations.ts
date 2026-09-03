import type { AgendamentoInsert, AgendamentoUpdate } from '~~/shared/types/database'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  ACTIVE_SCHEDULING_STATUSES,
  combineLocalDateTime,
  type AppointmentDraft
} from '../utils/scheduling'

type ConflictRow = {
  id: string
  inicio: string
  fim: string
  patio_vaga: number | null
  veiculo_id: string
  status: string
}

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

  async function findConflicts(
    draft: AppointmentDraft,
    excludeId?: string
  ): Promise<{ vehicle?: ConflictRow, patio?: ConflictRow } | { error: Error }> {
    const inicio = combineLocalDateTime(draft.date, draft.startTime)
    const fim = combineLocalDateTime(draft.date, draft.endTime)

    let query = supabase
      .from('agendamentos')
      .select('id, inicio, fim, patio_vaga, veiculo_id, status')
      .in('status', ACTIVE_SCHEDULING_STATUSES)
      .lt('inicio', fim.toISOString())
      .gt('fim', inicio.toISOString())

    if (excludeId) query = query.neq('id', excludeId)

    const { data, error } = await query
    if (error) return { error: new Error(error.message) }

    const rows = (data ?? []) as ConflictRow[]
    const vehicle = rows.find(row => row.veiculo_id === draft.veiculo_id)
    const patio = draft.patio_vaga == null
      ? undefined
      : rows.find(row => row.patio_vaga === draft.patio_vaga)

    return { vehicle, patio }
  }

  async function assertNoConflicts(draft: AppointmentDraft, excludeId?: string) {
    const result = await findConflicts(draft, excludeId)
    if ('error' in result) {
      toast.add({ title: 'Não foi possível validar conflitos', description: result.error.message, color: 'error' })
      return result.error
    }

    if (result.vehicle) {
      toast.add({
        title: 'Veículo já agendado neste horário',
        description: 'Escolha outro intervalo ou edite o agendamento existente.',
        color: 'error'
      })
      return new Error('vehicle conflict')
    }

    if (result.patio) {
      toast.add({
        title: `Vaga ${draft.patio_vaga} ocupada neste horário`,
        description: 'Escolha outra vaga do pátio ou outro horário.',
        color: 'error'
      })
      return new Error('patio conflict')
    }

    return null
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

    const conflictError = await assertNoConflicts(draft)
    if (conflictError) return { error: conflictError }

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

  async function updateAppointment(id: string, draft: AppointmentDraft) {
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

    const conflictError = await assertNoConflicts(draft, id)
    if (conflictError) return { error: conflictError }

    const payload: AgendamentoUpdate = {
      cliente_id: clienteId,
      veiculo_id: draft.veiculo_id,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      status: draft.status,
      servico: draft.servico.trim() || null,
      patio_vaga: draft.patio_vaga,
      observacoes: draft.observacoes.trim() || null
    }

    const { error } = await supabase.from('agendamentos').update(payload).eq('id', id)
    if (error) {
      toast.add({ title: 'Não foi possível atualizar o agendamento', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Agendamento atualizado', color: 'success' })
    return { error: null }
  }

  async function updateAppointmentStatus(
    id: string,
    status: AgendamentoStatus,
    options?: { successTitle?: string | false }
  ) {
    const payload: AgendamentoUpdate = { status }
    const { error } = await supabase.from('agendamentos').update(payload).eq('id', id)
    if (error) {
      toast.add({ title: 'Não foi possível atualizar o status', description: error.message, color: 'error' })
      return { error }
    }
    if (options?.successTitle !== false) {
      toast.add({ title: options?.successTitle || 'Status atualizado', color: 'success' })
    }
    return { error: null }
  }

  async function markNoShow(id: string, options?: { silent?: boolean }) {
    return updateAppointmentStatus(
      id,
      'nao_compareceu',
      { successTitle: options?.silent ? false : 'Marcado como não compareceu' }
    )
  }

  async function markHandledNoShow(id: string) {
    return updateAppointmentStatus(id, 'tratado', { successTitle: 'Não comparecimento tratado' })
  }

  async function undoNoShow(id: string, options?: { silent?: boolean }) {
    return updateAppointmentStatus(
      id,
      'agendado',
      { successTitle: options?.silent ? false : 'Não comparecimento desfeito' }
    )
  }

  return {
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    markNoShow,
    markHandledNoShow,
    undoNoShow
  }
}
