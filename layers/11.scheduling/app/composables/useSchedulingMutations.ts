import type { AgendamentoInsert, AgendamentoUpdate } from '~~/shared/types/database'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  ACTIVE_SCHEDULING_STATUSES,
  combineLocalDateTime,
  endOfLocalDay,
  startOfLocalDay,
  type AppointmentDraft
} from '../utils/scheduling'

type ConflictRow = {
  id: string
  inicio: string
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

  async function findSameDayConflict(
    draft: AppointmentDraft,
    excludeId?: string
  ): Promise<{ vehicle?: ConflictRow } | { error: Error }> {
    if (!draft.veiculo_id || !draft.date) return {}

    const day = combineLocalDateTime(draft.date, draft.startTime || '00:00')
    const dayStart = startOfLocalDay(day)
    const dayEnd = endOfLocalDay(day)

    let query = supabase
      .from('agendamentos')
      .select('id, inicio, veiculo_id, status')
      .eq('veiculo_id', draft.veiculo_id)
      .in('status', ACTIVE_SCHEDULING_STATUSES)
      .gte('inicio', dayStart.toISOString())
      .lte('inicio', dayEnd.toISOString())

    if (excludeId) query = query.neq('id', excludeId)

    const { data, error } = await query
    if (error) return { error: new Error(error.message) }

    const rows = (data ?? []) as ConflictRow[]
    return { vehicle: rows[0] }
  }

  async function assertNoConflicts(draft: AppointmentDraft, excludeId?: string) {
    const result = await findSameDayConflict(draft, excludeId)
    if ('error' in result) {
      toast.add({ title: 'Não foi possível validar conflitos', description: result.error.message, color: 'error' })
      return result.error
    }

    if (result.vehicle) {
      toast.add({
        title: 'Veículo já agendado neste dia',
        description: 'Edite o horário existente ou escolha outro dia.',
        color: 'error'
      })
      return new Error('vehicle conflict')
    }

    return null
  }

  function toPointInTime(draft: AppointmentDraft) {
    return combineLocalDateTime(draft.date, draft.startTime)
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

    if (!draft.date || !draft.startTime) {
      toast.add({ title: 'Informe data e horário', color: 'error' })
      return { error: new Error('datetime required') }
    }

    const conflictError = await assertNoConflicts(draft)
    if (conflictError) return { error: conflictError }

    // ponytail: schema still has fim; treat as point-in-time (no duration)
    const inicio = toPointInTime(draft)
    const iso = inicio.toISOString()

    const payload: AgendamentoInsert = {
      cliente_id: clienteId,
      veiculo_id: draft.veiculo_id,
      inicio: iso,
      fim: iso,
      status: 'agendado',
      servico: draft.problema.trim() || null,
      patio_vaga: null,
      observacoes: null,
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

    if (!draft.date || !draft.startTime) {
      toast.add({ title: 'Informe data e horário', color: 'error' })
      return { error: new Error('datetime required') }
    }

    const conflictError = await assertNoConflicts(draft, id)
    if (conflictError) return { error: conflictError }

    const inicio = toPointInTime(draft)
    const iso = inicio.toISOString()

    const payload: AgendamentoUpdate = {
      cliente_id: clienteId,
      veiculo_id: draft.veiculo_id,
      inicio: iso,
      fim: iso,
      servico: draft.problema.trim() || null,
      patio_vaga: null,
      observacoes: null
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
      { successTitle: options?.silent ? false : 'Marcado como faltou' }
    )
  }

  async function undoNoShow(id: string, options?: { silent?: boolean }) {
    return updateAppointmentStatus(
      id,
      'agendado',
      { successTitle: options?.silent ? false : 'Falta desfeita' }
    )
  }

  return {
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    markNoShow,
    undoNoShow
  }
}
