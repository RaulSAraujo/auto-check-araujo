import type { OrdemServico } from '~~/shared/types/database'
import type { KanbanColumnId } from '../utils/kanban'
import {
  formatStageDuration,
  isKanbanOverdue,
  KANBAN_COLUMNS,
  resolveKanbanColumn,
  resolveStageStartedAt
} from '../utils/kanban'

export type KanbanAppointment = {
  id: string
  inicio: string
  fim: string
  patio_vaga: number | null
  status: string
}

export type KanbanOrderCard = OrdemServico & {
  veiculos: {
    id: string
    placa: string
    marca: string | null
    modelo: string | null
    clientes: { id: string, nome: string } | null
  } | null
  profiles: { nome: string } | null
  appointment: KanbanAppointment | null
  column: KanbanColumnId
  stageStartedAt: string
  stageDurationLabel: string
  overdue: boolean
}

type KanbanQueryRow = OrdemServico & {
  veiculos: KanbanOrderCard['veiculos']
  profiles: KanbanOrderCard['profiles']
  agendamentos: KanbanAppointment[] | KanbanAppointment | null
}

const FINALIZED_LOOKBACK_DAYS = 14

const KANBAN_SELECT = `
  id,
  numero,
  status,
  orcamento_status,
  reclamacao,
  aberta_em,
  concluida_em,
  updated_at,
  veiculo_id,
  aberto_por,
  veiculos(id, placa, marca, modelo, clientes(id, nome)),
  profiles!ordens_servico_aberto_por_fkey(nome),
  agendamentos(id, inicio, fim, patio_vaga, status)
`

export async function useKanbanBoard() {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = await useAsyncData(
    'kanban-board',
    async () => {
      const finalizedCutoff = new Date()
      finalizedCutoff.setDate(finalizedCutoff.getDate() - FINALIZED_LOOKBACK_DAYS)
      const cutoffIso = finalizedCutoff.toISOString()

      const { data: rows, error: queryError } = await supabase
        .from('ordens_servico')
        .select(KANBAN_SELECT)
        .or(
          `status.in.(aberta,em_andamento,retrabalho),and(status.eq.concluida,concluida_em.gte.${cutoffIso})`
        )
        .order('updated_at', { ascending: false })
        .limit(200)

      if (queryError) throw queryError
      return (rows ?? []) as KanbanQueryRow[]
    }
  )

  const now = ref(new Date())

  if (import.meta.client) {
    function onFocus() {
      refresh()
    }

    let tick: ReturnType<typeof setInterval> | undefined

    onMounted(() => {
      window.addEventListener('focus', onFocus)
      tick = setInterval(() => {
        now.value = new Date()
      }, 60_000)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('focus', onFocus)
      if (tick) clearInterval(tick)
    })
  }

  const cards = computed(() => {
    const stamp = now.value
    const result: KanbanOrderCard[] = []

    for (const row of data.value ?? []) {
      const column = resolveKanbanColumn(row.status, row.orcamento_status)
      if (!column) continue

      const stageStartedAt = resolveStageStartedAt(row)
      const { agendamentos: _linked, ...order } = row
      const appointment = Array.isArray(_linked) ? _linked[0] ?? null : _linked

      result.push({
        ...order,
        appointment,
        column,
        stageStartedAt,
        stageDurationLabel: formatStageDuration(stageStartedAt, stamp),
        overdue: isKanbanOverdue(column, stageStartedAt, stamp)
      })
    }

    return result
  })

  const columns = computed(() =>
    KANBAN_COLUMNS.map(column => ({
      ...column,
      items: cards.value.filter(card => card.column === column.id),
      overdueCount: cards.value.filter(
        card => card.column === column.id && card.overdue
      ).length
    }))
  )

  const overdueTotal = computed(() =>
    cards.value.filter(card => card.overdue).length
  )

  return {
    columns,
    overdueTotal,
    pending,
    error,
    refresh
  }
}
