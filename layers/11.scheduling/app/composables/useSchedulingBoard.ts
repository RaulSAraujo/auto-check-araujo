import type { Agendamento } from '~~/shared/types/database'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  addDays,
  endOfLocalDay,
  endOfWeek,
  isSameLocalDay,
  startOfLocalDay,
  startOfWeek,
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

type QueryRow = Agendamento & {
  clientes: SchedulingAppointment['clientes']
  veiculos: SchedulingAppointment['veiculos']
}

function matchesSearch(row: SchedulingAppointment, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  const placa = row.veiculos?.placa?.toLowerCase() || ''
  const nome = row.clientes?.nome?.toLowerCase() || ''
  const problema = (row.servico || row.observacoes || '').toLowerCase()
  const placaDigits = placa.replace(/[^a-z0-9]/g, '')
  const qDigits = q.replace(/[^a-z0-9]/g, '')
  return nome.includes(q)
    || placa.includes(q)
    || placaDigits.includes(qDigits)
    || problema.includes(q)
}

function matchesStatusFilter(row: SchedulingAppointment, filter: SchedulingStatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'nao_compareceu') return row.status === 'nao_compareceu'
  if (filter === 'agendados') {
    return row.status === 'agendado' || row.status === 'confirmado' || row.status === 'em_atendimento'
  }
  return true
}

function dateQueryValue(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
      router.replace({ query: { ...route.query, dia: dateQueryValue(value) } })
    }
  })

  const view = computed({
    get(): SchedulingView {
      const raw = route.query.vista
      if (raw === 'week' || raw === 'calendar') return 'week'
      return 'daily'
    },
    set(value: SchedulingView) {
      const next = { ...route.query }
      if (value === 'daily') delete next.vista
      else next.vista = value
      router.replace({ query: next })
    }
  })

  const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
  let searchWriteTimer: ReturnType<typeof setTimeout> | undefined

  watch(() => route.query.q, (query) => {
    const next = typeof query === 'string' ? query : ''
    if (next !== search.value) search.value = next
  })

  watch(search, (value) => {
    clearTimeout(searchWriteTimer)
    searchWriteTimer = setTimeout(() => {
      const current = typeof route.query.q === 'string' ? route.query.q : ''
      const trimmed = value.trim()
      if (current === trimmed || (!current && !trimmed)) return
      const next = { ...route.query }
      if (trimmed) next.q = trimmed
      else delete next.q
      router.replace({ query: next })
    }, 300)
  })

  onUnmounted(() => clearTimeout(searchWriteTimer))

  const statusFilter = computed({
    get(): SchedulingStatusFilter {
      const raw = route.query.filtro
      if (raw === 'agendados' || raw === 'nao_compareceu') return raw
      return 'all'
    },
    set(value: SchedulingStatusFilter) {
      const next = { ...route.query }
      if (value === 'all') delete next.filtro
      else next.filtro = value
      router.replace({ query: next })
    }
  })

  const queryStart = computed(() =>
    view.value === 'week'
      ? startOfWeek(selectedDate.value)
      : startOfLocalDay(selectedDate.value)
  )
  const queryEnd = computed(() =>
    view.value === 'week'
      ? endOfWeek(selectedDate.value)
      : endOfLocalDay(selectedDate.value)
  )

  const SCHEDULING_SELECT = `
    id,
    cliente_id,
    veiculo_id,
    ordem_servico_id,
    inicio,
    fim,
    status,
    servico,
    patio_vaga,
    observacoes,
    criado_por,
    created_at,
    updated_at,
    clientes(id, nome),
    veiculos(id, placa, marca, modelo)
  `

  const { data, pending, refresh, error } = await useAsyncData(
    'scheduling-board',
    async () => {
      let query = supabase
        .from('agendamentos')
        .select(SCHEDULING_SELECT)
        .gte('inicio', queryStart.value.toISOString())
        .lte('inicio', queryEnd.value.toISOString())
        .order('inicio', { ascending: true })

      const filter = statusFilter.value
      if (filter === 'nao_compareceu') {
        query = query.eq('status', 'nao_compareceu')
      } else if (filter === 'agendados') {
        query = query.in('status', ['agendado', 'confirmado', 'em_atendimento'])
      }

      const { data: rows, error: queryError } = await query
      if (queryError) throw queryError
      return (rows ?? []) as QueryRow[]
    },
    {
      watch: [queryStart, queryEnd, statusFilter],
      lazy: true
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

  const dayHasAppointments = computed(() =>
    appointments.value.some((row) => {
      if (!isSameLocalDay(new Date(row.inicio), selectedDate.value)) return false
      return row.status !== 'cancelado' && row.status !== 'tratado'
    })
  )

  const hasActiveFilters = computed(() =>
    search.value.trim().length > 0 || statusFilter.value !== 'all'
  )

  const weekCounts = computed(() => {
    const map = new Map<string, number>()
    for (const row of appointments.value) {
      if (row.status === 'cancelado' || row.status === 'tratado') continue
      if (search.value && !matchesSearch(row, search.value)) continue
      if (!matchesStatusFilter(row, statusFilter.value)) continue
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

  function shiftWeek(delta: number) {
    selectedDate.value = addDays(startOfWeek(selectedDate.value), delta * 7)
  }

  /** Select a day and switch to Dia in one navigation (avoids racing two replace calls). */
  function selectDay(day: Date) {
    const { vista: _vista, ...rest } = route.query
    router.replace({
      query: { ...rest, dia: dateQueryValue(startOfLocalDay(day)) }
    })
  }

  return {
    selectedDate,
    view,
    search,
    statusFilter,
    appointments,
    dayAppointments,
    dayHasAppointments,
    hasActiveFilters,
    weekCounts,
    pending,
    error,
    refresh,
    goToday,
    shiftDay,
    shiftWeek,
    selectDay
  }
}
