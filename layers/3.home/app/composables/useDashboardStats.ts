import type { FinanceSummary } from '#layers/management/app/utils/finance'
import type { OrdemStatus, AgendamentoStatus } from '~~/shared/types/oficina'

export type DashboardStats = {
  clientes: number
  veiculos: number
  os_abertas: number
  os_andamento: number
}

export type DashboardStatusCounts = Record<'aberta' | 'em_andamento', number>

export type DashboardDayPoint = {
  key: string
  label: string
  count: number
  valor: number
}

export type DashboardActiveOrder = {
  id: string
  numero: string
  status: OrdemStatus
  aberta_em: string
  veiculos: {
    placa: string
    marca: string | null
    modelo: string | null
    clientes: { id: string, nome: string } | null
  } | null
}

export type DashboardAppointment = {
  id: string
  inicio: string
  fim: string
  status: AgendamentoStatus
  servico: string | null
  patio_vaga: number | null
  clientes: { id: string, nome: string } | null
  veiculos: {
    id: string
    placa: string
    marca: string | null
    modelo: string | null
  } | null
}

type DashboardHomePayload = {
  clientes: number
  veiculos: number
  status_counts: DashboardStatusCounts
  active_orders: DashboardActiveOrder[]
  weekly_trend: Array<{ day: string, count: number, valor: number }>
  today_appointments: DashboardAppointment[]
  finance: FinanceSummary | null
  local_date: string
}

const EMPTY_STATUS: DashboardStatusCounts = {
  aberta: 0,
  em_andamento: 0
}

const EMPTY_FINANCE: FinanceSummary = {
  total_faturado: 0,
  total_pago: 0,
  total_pendente: 0,
  qtd_os: 0,
  total_a_pagar: 0,
  total_pago_despesas: 0,
  total_vencido: 0,
  entradas: 0,
  saidas: 0,
  saldo: 0
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

function dayKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildWeekSkeleton(localDate: string): DashboardDayPoint[] {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
  const end = parseLocalDate(localDate)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end)
    date.setDate(end.getDate() - (6 - index))
    const label = weekday.format(date).replace('.', '')
    return {
      key: dayKeyFromDate(date),
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count: 0,
      valor: 0
    }
  })
}

function mergeWeeklyTrend(
  localDate: string,
  rows: DashboardHomePayload['weekly_trend']
): DashboardDayPoint[] {
  const points = buildWeekSkeleton(localDate)
  const byDay = new Map(points.map(point => [point.key, point]))

  for (const row of rows) {
    const key = String(row.day).slice(0, 10)
    const point = byDay.get(key)
    if (!point) continue
    point.count = Number(row.count ?? 0)
    point.valor = Number(row.valor ?? 0)
  }

  return points
}

function normalizeFinance(raw: unknown): FinanceSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<FinanceSummary>
  return {
    total_faturado: Number(data.total_faturado ?? 0),
    total_pago: Number(data.total_pago ?? 0),
    total_pendente: Number(data.total_pendente ?? 0),
    qtd_os: Number(data.qtd_os ?? 0),
    total_a_pagar: Number(data.total_a_pagar ?? 0),
    total_pago_despesas: Number(data.total_pago_despesas ?? 0),
    total_vencido: Number(data.total_vencido ?? 0),
    entradas: Number(data.entradas ?? 0),
    saidas: Number(data.saidas ?? 0),
    saldo: Number(data.saldo ?? 0)
  }
}

function normalizePayload(raw: unknown): {
  stats: DashboardStats
  statusCounts: DashboardStatusCounts
  weeklyTrend: DashboardDayPoint[]
  activeOrders: DashboardActiveOrder[]
  todayAppointments: DashboardAppointment[]
  finance: FinanceSummary | null
} {
  const data = (raw || {}) as Partial<DashboardHomePayload>
  const localDate = typeof data.local_date === 'string'
    ? data.local_date.slice(0, 10)
    : dayKeyFromDate(new Date())

  const statusCounts: DashboardStatusCounts = {
    aberta: Number(data.status_counts?.aberta ?? 0),
    em_andamento: Number(data.status_counts?.em_andamento ?? 0)
  }

  return {
    stats: {
      clientes: Number(data.clientes ?? 0),
      veiculos: Number(data.veiculos ?? 0),
      os_abertas: statusCounts.aberta,
      os_andamento: statusCounts.em_andamento
    },
    statusCounts,
    weeklyTrend: mergeWeeklyTrend(localDate, data.weekly_trend ?? []),
    activeOrders: (data.active_orders ?? []) as DashboardActiveOrder[],
    todayAppointments: (data.today_appointments ?? []) as DashboardAppointment[],
    finance: normalizeFinance(data.finance)
  }
}

export async function useDashboardStats() {
  const supabase = useTypedSupabaseClient()

  const { data, pending, error, refresh } = await useAsyncData('dashboard-home', async () => {
    const { data: payload, error: rpcError } = await supabase.rpc('dashboard_home', {
      p_now: new Date().toISOString()
    })

    if (rpcError) throw rpcError
    return normalizePayload(payload)
  })

  const stats = computed(() => data.value?.stats ?? null)
  const statusCounts = computed(() => data.value?.statusCounts ?? EMPTY_STATUS)
  const weeklyTrend = computed(() => data.value?.weeklyTrend ?? buildWeekSkeleton(dayKeyFromDate(new Date())))
  const activeOrders = computed(() => data.value?.activeOrders ?? [])
  const todayAppointments = computed(() => data.value?.todayAppointments ?? [])
  const financeSummary = computed(() => data.value?.finance ?? null)
  const osAbertas = computed(() => stats.value?.os_abertas ?? statusCounts.value.aberta)
  const osAndamento = computed(() => stats.value?.os_andamento
    ?? statusCounts.value.em_andamento)
  const clientesCount = computed(() => stats.value?.clientes ?? 0)
  const veiculosCount = computed(() => stats.value?.veiculos ?? 0)
  const activeOrdersTotal = computed(() =>
    statusCounts.value.aberta
    + statusCounts.value.em_andamento
  )
  const weeklyCompletedTotal = computed(() =>
    weeklyTrend.value.reduce((sum, point) => sum + point.count, 0)
  )
  const weeklyRevenueTotal = computed(() =>
    weeklyTrend.value.reduce((sum, point) => sum + point.valor, 0)
  )
  const showFinance = computed(() => financeSummary.value != null)
  const finance = computed(() => financeSummary.value ?? EMPTY_FINANCE)

  return {
    pending,
    error,
    refresh,
    stats,
    statusCounts,
    weeklyTrend,
    activeOrders,
    todayAppointments,
    osAbertas,
    osAndamento,
    clientesCount,
    veiculosCount,
    activeOrdersTotal,
    weeklyCompletedTotal,
    weeklyRevenueTotal,
    showFinance,
    financeSummary: finance
  }
}
