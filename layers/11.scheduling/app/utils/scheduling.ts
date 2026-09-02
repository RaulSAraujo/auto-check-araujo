import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  AGENDAMENTO_STATUS_COLOR,
  AGENDAMENTO_STATUS_LABEL
} from '~~/shared/types/oficina'

export {
  AGENDAMENTO_STATUS_COLOR,
  AGENDAMENTO_STATUS_LABEL
}

export const PATIO_SLOT_COUNT = 8

export const TIMELINE_START_HOUR = 7
export const TIMELINE_END_HOUR = 18
export const LUNCH_HOUR = 12

export type SchedulingView = 'daily' | 'calendar'
export type SchedulingStatusFilter = 'all' | 'agendados' | 'nao_compareceu' | 'patio'

export const SCHEDULING_VIEW_ITEMS = [
  { label: 'Agenda diária', value: 'daily' as const, icon: 'i-lucide-list' },
  { label: 'Calendário', value: 'calendar' as const, icon: 'i-lucide-calendar' }
]

export const SCHEDULING_STATUS_FILTER_ITEMS = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Agendados', value: 'agendados' as const },
  { label: 'Não compareceu', value: 'nao_compareceu' as const },
  { label: 'Pátio', value: 'patio' as const }
]

export const AGENDAMENTO_STATUS_SELECT_ITEMS = (
  Object.entries(AGENDAMENTO_STATUS_LABEL) as [AgendamentoStatus, string][]
).map(([value, label]) => ({ value, label }))

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function formatDayHeading(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMonthHeading(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatTimeRange(inicio: string, fim: string): string {
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${fmt.format(new Date(inicio))} – ${fmt.format(new Date(fim))}`
}

export function formatTimeShort(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function combineLocalDateTime(dateStr: string, timeStr: string): Date {
  const dateParts = dateStr.split('-').map(Number)
  const timeParts = timeStr.split(':').map(Number)
  const y = dateParts[0] ?? 0
  const mo = dateParts[1] ?? 1
  const d = dateParts[2] ?? 1
  const h = timeParts[0] ?? 0
  const mi = timeParts[1] ?? 0
  return new Date(y, mo - 1, d, h, mi, 0, 0)
}

export function isActivePatioStatus(status: AgendamentoStatus): boolean {
  return status === 'agendado'
    || status === 'confirmado'
    || status === 'em_atendimento'
}

export function timelineHours(): number[] {
  const hours: number[] = []
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) hours.push(h)
  return hours
}

export function buildMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor)
  const startWeekday = (first.getDay() + 6) % 7 // Monday = 0
  const gridStart = addDays(first, -startWeekday)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export type AppointmentDraft = {
  veiculo_id: string
  date: string
  startTime: string
  endTime: string
  status: AgendamentoStatus
  servico: string
  patio_vaga: number | null
  observacoes: string
}

export function emptyAppointmentDraft(day: Date = new Date()): AppointmentDraft {
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  const end = new Date(day)
  end.setHours(10, 0, 0, 0)

  return {
    veiculo_id: '',
    date: toDateInputValue(day),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    status: 'agendado',
    servico: '',
    patio_vaga: null,
    observacoes: ''
  }
}

export const PATIO_SLOT_ITEMS = Array.from({ length: PATIO_SLOT_COUNT }, (_, i) => ({
  label: `Vaga ${i + 1}`,
  value: i + 1
}))
