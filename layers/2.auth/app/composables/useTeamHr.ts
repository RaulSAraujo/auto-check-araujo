import type {
  ColaboradorFalta,
  ColaboradorOcorrencia,
  ColaboradorPresenca
} from '~~/shared/types/database'
import type { FaltaTipo, OcorrenciaTipo, PresencaStatus } from '~~/shared/types/oficina'
import { teamMonthBounds } from '../utils/team'

export type TeamPresenceRow = ColaboradorPresenca & {
  profiles: { nome: string } | null
}

export type TeamAbsenceRow = ColaboradorFalta & {
  profiles: { nome: string } | null
}

export type TeamIncidentRow = ColaboradorOcorrencia & {
  profiles: { nome: string } | null
}

export type TeamIndicatorCollaborator = {
  id: string
  nome: string
  os_concluidas: number
  presenca_pct: number | null
  faltas: number
}

export type TeamIndicators = {
  os_concluidas: number
  taxa_presenca: number | null
  faltas: number
  por_colaborador: TeamIndicatorCollaborator[]
}

function normalizeIndicators(raw: unknown): TeamIndicators {
  const data = (raw || {}) as Partial<TeamIndicators>
  const rows = Array.isArray(data.por_colaborador) ? data.por_colaborador : []
  return {
    os_concluidas: Number(data.os_concluidas ?? 0),
    taxa_presenca: data.taxa_presenca == null ? null : Number(data.taxa_presenca),
    faltas: Number(data.faltas ?? 0),
    por_colaborador: rows.map(row => ({
      id: String(row.id),
      nome: String(row.nome),
      os_concluidas: Number(row.os_concluidas ?? 0),
      presenca_pct: row.presenca_pct == null ? null : Number(row.presenca_pct),
      faltas: Number(row.faltas ?? 0)
    }))
  }
}

export function useTeamPresences(
  month: Ref<string>,
  collaboratorId: Ref<string | 'all'>
) {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    () => `team-presences-${month.value}-${collaboratorId.value}`,
    async () => {
      const { start, end } = teamMonthBounds(month.value)
      let query = supabase
        .from('colaborador_presencas')
        .select('id, colaborador_id, data, status, observacao, registrado_por, created_at, updated_at, profiles!colaborador_presencas_colaborador_id_fkey(nome)')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })
        .limit(REPORT_SOFT_LIMIT)

      if (collaboratorId.value !== 'all') {
        query = query.eq('colaborador_id', collaboratorId.value)
      }

      const { data: rows, error: queryError } = await query
      if (queryError) throw queryError
      return (rows || []) as TeamPresenceRow[]
    },
    { watch: [month, collaboratorId] }
  )

  return { rows: data, pending, refresh, error }
}

export function useTeamAbsences(
  month: Ref<string>,
  collaboratorId: Ref<string | 'all'>
) {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    () => `team-absences-${month.value}-${collaboratorId.value}`,
    async () => {
      const { start, end } = teamMonthBounds(month.value)
      let query = supabase
        .from('colaborador_faltas')
        .select('id, colaborador_id, data, tipo, observacao, registrado_por, created_at, updated_at, profiles!colaborador_faltas_colaborador_id_fkey(nome)')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })
        .limit(REPORT_SOFT_LIMIT)

      if (collaboratorId.value !== 'all') {
        query = query.eq('colaborador_id', collaboratorId.value)
      }

      const { data: rows, error: queryError } = await query
      if (queryError) throw queryError
      return (rows || []) as TeamAbsenceRow[]
    },
    { watch: [month, collaboratorId] }
  )

  return { rows: data, pending, refresh, error }
}

export function useTeamIncidents(
  month: Ref<string>,
  collaboratorId: Ref<string | 'all'>
) {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    () => `team-incidents-${month.value}-${collaboratorId.value}`,
    async () => {
      const { start, end } = teamMonthBounds(month.value)
      let query = supabase
        .from('colaborador_ocorrencias')
        .select('id, colaborador_id, ocorrido_em, tipo, descricao, registrado_por, created_at, profiles!colaborador_ocorrencias_colaborador_id_fkey(nome)')
        .gte('ocorrido_em', start)
        .lte('ocorrido_em', end)
        .order('ocorrido_em', { ascending: false })
        .limit(REPORT_SOFT_LIMIT)

      if (collaboratorId.value !== 'all') {
        query = query.eq('colaborador_id', collaboratorId.value)
      }

      const { data: rows, error: queryError } = await query
      if (queryError) throw queryError
      return (rows || []) as TeamIncidentRow[]
    },
    { watch: [month, collaboratorId] }
  )

  return { rows: data, pending, refresh, error }
}

export function useTeamIndicators(
  month: Ref<string>
) {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    () => `team-indicators-${month.value}`,
    async () => {
      const { start, end } = teamMonthBounds(month.value)
      const { data: raw, error: rpcError } = await supabase.rpc('equipe_indicadores', {
        p_inicio: start,
        p_fim: end
      })
      if (rpcError) throw rpcError
      return normalizeIndicators(raw)
    },
    { watch: [month] }
  )

  return { indicators: data, pending, refresh, error }
}

export function useTeamHrMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()
  const user = useSupabaseUser()

  async function upsertPresence(payload: {
    colaborador_id: string
    data: string
    status: PresencaStatus
    observacao?: string
  }) {
    const { error } = await supabase.from('colaborador_presencas').upsert({
      colaborador_id: payload.colaborador_id,
      data: payload.data,
      status: payload.status,
      observacao: payload.observacao?.trim() || null,
      registrado_por: user.value?.id ?? null
    }, { onConflict: 'colaborador_id,data' })

    if (error) {
      toast.add({
        title: 'Erro ao registrar presença',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({ title: 'Presença registrada', color: 'success' })
    return { error: null }
  }

  async function deletePresence(id: string) {
    const { error } = await supabase.from('colaborador_presencas').delete().eq('id', id)
    if (error) {
      toast.add({
        title: 'Erro ao remover presença',
        description: error.message,
        color: 'error'
      })
      return { error }
    }
    toast.add({ title: 'Presença removida', color: 'success' })
    return { error: null }
  }

  async function createAbsence(payload: {
    colaborador_id: string
    data: string
    tipo: FaltaTipo
    observacao?: string
  }) {
    const { error } = await supabase.from('colaborador_faltas').insert({
      colaborador_id: payload.colaborador_id,
      data: payload.data,
      tipo: payload.tipo,
      observacao: payload.observacao?.trim() || null,
      registrado_por: user.value?.id ?? null
    })

    if (error) {
      toast.add({
        title: 'Erro ao registrar falta',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({ title: 'Falta registrada', color: 'success' })
    return { error: null }
  }

  async function deleteAbsence(id: string) {
    const { error } = await supabase.from('colaborador_faltas').delete().eq('id', id)
    if (error) {
      toast.add({
        title: 'Erro ao remover falta',
        description: error.message,
        color: 'error'
      })
      return { error }
    }
    toast.add({ title: 'Falta removida', color: 'success' })
    return { error: null }
  }

  async function createIncident(payload: {
    colaborador_id: string
    ocorrido_em: string
    tipo: OcorrenciaTipo
    descricao: string
  }) {
    const { error } = await supabase.from('colaborador_ocorrencias').insert({
      colaborador_id: payload.colaborador_id,
      ocorrido_em: payload.ocorrido_em,
      tipo: payload.tipo,
      descricao: payload.descricao.trim(),
      registrado_por: user.value?.id ?? null
    })

    if (error) {
      toast.add({
        title: 'Erro ao registrar ocorrência',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({ title: 'Ocorrência registrada', color: 'success' })
    return { error: null }
  }

  async function deleteIncident(id: string) {
    const { error } = await supabase.from('colaborador_ocorrencias').delete().eq('id', id)
    if (error) {
      toast.add({
        title: 'Erro ao remover ocorrência',
        description: error.message,
        color: 'error'
      })
      return { error }
    }
    toast.add({ title: 'Ocorrência removida', color: 'success' })
    return { error: null }
  }

  return {
    upsertPresence,
    deletePresence,
    createAbsence,
    deleteAbsence,
    createIncident,
    deleteIncident
  }
}
