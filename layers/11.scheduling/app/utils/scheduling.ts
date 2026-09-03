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
  { label: 'Agenda', value: 'daily' as const },
  { label: 'Mês', value: 'calendar' as const }
]

export const SCHEDULING_STATUS_FILTER_ITEMS = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Agendados', value: 'agendados' as const },
  { label: 'Faltas', value: 'nao_compareceu' as const },
  { label: 'Pátio', value: 'patio' as const }
]

export const AGENDAMENTO_STATUS_SELECT_ITEMS = (
  Object.entries(AGENDAMENTO_STATUS_LABEL) as [AgendamentoStatus, string][]
).map(([value, label]) => ({ value, label }))

export const ACTIVE_SCHEDULING_STATUSES: AgendamentoStatus[] = [
  'agendado',
  'confirmado',
  'em_atendimento'
]

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

export function formatDayHeadingShort(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatBoardDate(date: Date): { day: string, weekday: string, monthYear: string } {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
  const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return {
    day: String(date.getDate()).padStart(2, '0'),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    monthYear: monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
  }
}

export function statusBarClass(status: AgendamentoStatus): string {
  const color = AGENDAMENTO_STATUS_COLOR[status]
  if (color === 'info') return 'border-l-info'
  if (color === 'success') return 'border-l-success'
  if (color === 'warning') return 'border-l-warning'
  if (color === 'error') return 'border-l-error'
  if (color === 'primary') return 'border-l-primary'
  return 'border-l-muted'
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

export function schedulingDayPath(date: Date): string {
  return `/agendamentos?dia=${toDateInputValue(date)}`
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
  return ACTIVE_SCHEDULING_STATUSES.includes(status)
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

export type AppointmentCreatePrefill = {
  hour?: number
  patioVaga?: number | null
}

export function emptyAppointmentDraft(
  day: Date = new Date(),
  prefill?: AppointmentCreatePrefill
): AppointmentDraft {
  const start = new Date(day)
  start.setHours(prefill?.hour ?? 9, 0, 0, 0)
  const end = new Date(start)
  end.setHours(start.getHours() + 1, 0, 0, 0)

  return {
    veiculo_id: '',
    date: toDateInputValue(day),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    status: 'agendado',
    servico: '',
    patio_vaga: prefill?.patioVaga ?? null,
    observacoes: ''
  }
}

export function appointmentToDraft(row: {
  veiculo_id: string
  inicio: string
  fim: string
  status: AgendamentoStatus
  servico: string | null
  patio_vaga: number | null
  observacoes: string | null
}): AppointmentDraft {
  return {
    veiculo_id: row.veiculo_id,
    date: toDateInputValue(new Date(row.inicio)),
    startTime: toTimeInputValue(new Date(row.inicio)),
    endTime: toTimeInputValue(new Date(row.fim)),
    status: row.status,
    servico: row.servico?.trim() || '',
    patio_vaga: row.patio_vaga,
    observacoes: row.observacoes?.trim() || ''
  }
}

export type AppointmentFormError = { name: string, message: string }

export function validateAppointmentDraft(draft: AppointmentDraft): AppointmentFormError[] {
  const errors: AppointmentFormError[] = []

  if (!draft.veiculo_id) {
    errors.push({ name: 'veiculo_id', message: 'Selecione o veículo' })
  }
  if (!draft.date) {
    errors.push({ name: 'date', message: 'Informe a data' })
  }
  if (!draft.startTime) {
    errors.push({ name: 'startTime', message: 'Informe o início' })
  }
  if (!draft.endTime) {
    errors.push({ name: 'endTime', message: 'Informe o fim' })
  }

  if (draft.date && draft.startTime && draft.endTime) {
    const inicio = combineLocalDateTime(draft.date, draft.startTime)
    const fim = combineLocalDateTime(draft.date, draft.endTime)
    if (!(fim > inicio)) {
      errors.push({ name: 'endTime', message: 'O fim deve ser depois do início' })
    }
  }

  return errors
}

export const PATIO_SLOT_ITEMS = Array.from({ length: PATIO_SLOT_COUNT }, (_, i) => ({
  label: `Vaga ${i + 1}`,
  value: i + 1
}))
