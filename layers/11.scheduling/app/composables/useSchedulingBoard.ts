import type { Agendamento } from '~~/shared/types/database'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  addDays,
  endOfLocalDay,
  endOfMonth,
  isActivePatioStatus,
  isSameLocalDay,
  PATIO_SLOT_COUNT,
  startOfLocalDay,
  startOfMonth,
  type SchedulingStatusFilter,
  type SchedulingView
} from '../utils/scheduling'

export type SchedulingAppointment = Agendamento & {
  status: AgendamentoStatus
  clientes: { id: string, nome: string } | null
  veiculos: {
    id: string
    placa: string
    marca: string | null
    modelo: string | null
  } | null
}

export type PatioSlot = {
  slot: number
  appointment: SchedulingAppointment | null
}

type QueryRow = Agendamento & {
  clientes: SchedulingAppointment['clientes']
  veiculos: SchedulingAppointment['veiculos']
}

function matchesSearch(row: SchedulingAppointment, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  const placa = row.veiculos?.placa?.toLowerCase() || ''
  const nome = row.clientes?.nome?.toLowerCase() || ''
  const servico = row.servico?.toLowerCase() || ''
  const placaDigits = placa.replace(/[^a-z0-9]/g, '')
  const qDigits = q.replace(/[^a-z0-9]/g, '')
  return nome.includes(q)
    || placa.includes(q)
    || placaDigits.includes(qDigits)
    || servico.includes(q)
}

function matchesStatusFilter(row: SchedulingAppointment, filter: SchedulingStatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'nao_compareceu') return row.status === 'nao_compareceu'
  if (filter === 'agendados') {
    return row.status === 'agendado' || row.status === 'confirmado' || row.status === 'em_atendimento'
  }
  if (filter === 'patio') return row.patio_vaga != null && isActivePatioStatus(row.status)
  return true
}

export async function useSchedulingBoard() {
  const supabase = useTypedSupabaseClient()
  const route = useRoute()
  const router = useRouter()

  const selectedDate = computed({
    get() {
      const raw = typeof route.query.dia === 'string' ? route.query.dia : ''
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const parts = raw.split('-').map(Number)
        const y = parts[0] ?? new Date().getFullYear()
        const m = parts[1] ?? 1
        const d = parts[2] ?? 1
        return startOfLocalDay(new Date(y, m - 1, d))
      }
      return startOfLocalDay(new Date())
    },
    set(value: Date) {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')
      router.replace({ query: { ...route.query, dia: `${y}-${m}-${d}` } })
    }
  })

  const view = computed({
    get(): SchedulingView {
      return route.query.vista === 'calendar' ? 'calendar' : 'daily'
    },
    set(value: SchedulingView) {
      const next = { ...route.query }
      if (value === 'daily') delete next.vista
      else next.vista = value
      router.replace({ query: next })
    }
  })

  const search = computed({
    get: () => (typeof route.query.q === 'string' ? route.query.q : ''),
    set(value: string) {
      const next = { ...route.query }
      if (value.trim()) next.q = value
      else delete next.q
      router.replace({ query: next })
    }
  })

  const statusFilter = computed({
    get(): SchedulingStatusFilter {
      const raw = route.query.filtro
      if (raw === 'agendados' || raw === 'nao_compareceu' || raw === 'patio') return raw
      return 'all'
    },
    set(value: SchedulingStatusFilter) {
      const next = { ...route.query }
      if (value === 'all') delete next.filtro
      else next.filtro = value
      router.replace({ query: next })
    }
  })

  const rangeStart = computed(() => startOfMonth(addDays(startOfMonth(selectedDate.value), -7)))
  const rangeEnd = computed(() => endOfMonth(addDays(endOfMonth(selectedDate.value), 7)))

  const { data, pending, refresh, error } = await useAsyncData(
    'scheduling-board',
    async () => {
      const { data: rows, error: queryError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes(id, nome),
          veiculos(id, placa, marca, modelo)
        `)
        .gte('inicio', rangeStart.value.toISOString())
        .lte('inicio', rangeEnd.value.toISOString())
        .order('inicio', { ascending: true })

      if (queryError) throw queryError
      return (rows ?? []) as QueryRow[]
    },
    {
      watch: [rangeStart, rangeEnd]
    }
  )

  const appointments = computed(() =>
    (data.value ?? []).map(row => ({
      ...row,
      status: row.status as AgendamentoStatus
    })) as SchedulingAppointment[]
  )

  const dayAppointments = computed(() => {
    const day = selectedDate.value
    return appointments.value
      .filter(row => isSameLocalDay(new Date(row.inicio), day))
      .filter(row => matchesSearch(row, search.value))
      .filter(row => matchesStatusFilter(row, statusFilter.value))
      .filter(row =>
        (row.status !== 'cancelado' && row.status !== 'tratado')
        || statusFilter.value === 'all'
      )
  })

  const patioSlots = computed<PatioSlot[]>(() => {
    const day = selectedDate.value
    const active = appointments.value.filter(row =>
      isSameLocalDay(new Date(row.inicio), day)
      && row.patio_vaga != null
      && isActivePatioStatus(row.status)
    )

    return Array.from({ length: PATIO_SLOT_COUNT }, (_, i) => {
      const slot = i + 1
      return {
        slot,
        appointment: active.find(row => row.patio_vaga === slot) ?? null
      }
    })
  })

  const noShows = computed(() => {
    const day = selectedDate.value
    const lookback = startOfLocalDay(addDays(day, -7))
    const until = endOfLocalDay(day)
    return appointments.value
      .filter(row => row.status === 'nao_compareceu')
      .filter((row) => {
        const start = new Date(row.inicio)
        return start >= lookback && start <= until
      })
      .filter(row => matchesSearch(row, search.value))
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
  })

  const monthCounts = computed(() => {
    const map = new Map<string, number>()
    for (const row of appointments.value) {
      if (row.status === 'cancelado' || row.status === 'tratado') continue
      if (search.value && !matchesSearch(row, search.value)) continue
      const key = startOfLocalDay(new Date(row.inicio)).toISOString()
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  })

  function goToday() {
    selectedDate.value = startOfLocalDay(new Date())
  }

  function shiftDay(delta: number) {
    selectedDate.value = addDays(selectedDate.value, delta)
  }

  function shiftMonth(delta: number) {
    const current = selectedDate.value
    selectedDate.value = startOfLocalDay(
      new Date(current.getFullYear(), current.getMonth() + delta, 1)
    )
  }

  return {
    selectedDate,
    view,
    search,
    statusFilter,
    appointments,
    dayAppointments,
    patioSlots,
    noShows,
    monthCounts,
    pending,
    error,
    refresh,
    goToday,
    shiftDay,
    shiftMonth
  }
}
