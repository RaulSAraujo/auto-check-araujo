import type { AgendamentoStatus } from '~~/shared/types/oficina'
import {
  AGENDAMENTO_STATUS_COLOR,
  AGENDAMENTO_STATUS_LABEL
} from '~~/shared/types/oficina'

export {
  AGENDAMENTO_STATUS_COLOR,
  AGENDAMENTO_STATUS_LABEL
}

export const TIMELINE_START_HOUR = 7
export const TIMELINE_END_HOUR = 18

export type SchedulingView = 'daily' | 'week'
export type SchedulingStatusFilter = 'all' | 'agendados' | 'nao_compareceu'

export const SCHEDULING_VIEW_ITEMS = [
  { label: 'Dia', value: 'daily' as const },
  { label: 'Semana', value: 'week' as const }
]

export const SCHEDULING_STATUS_FILTER_ITEMS = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Agendados', value: 'agendados' as const },
  { label: 'Faltas', value: 'nao_compareceu' as const }
]

/** Statuses that still count as “coming / in house” for day conflict checks. */
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

/** Monday as first day of the week. */
export function startOfWeek(date: Date): Date {
  const day = startOfLocalDay(date)
  const weekday = (day.getDay() + 6) % 7
  return addDays(day, -weekday)
}

export function endOfWeek(date: Date): Date {
  return endOfLocalDay(addDays(startOfWeek(date), 6))
}

export function buildWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
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

export function formatWeekHeading(date: Date): string {
  const start = startOfWeek(date)
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const startLabel = sameMonth
    ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric' }).format(start)
    : new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(start)
  const endLabel = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(end)
  return `${startLabel} – ${endLabel}`
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

/** Reported problem text: prefer servico, fall back to legacy observacoes. */
export function appointmentProblem(row: {
  observacoes?: string | null
  servico?: string | null
}): string {
  return row.servico?.trim() || row.observacoes?.trim() || ''
}

export type AppointmentDraft = {
  veiculo_id: string
  date: string
  startTime: string
  problema: string
}

export type AppointmentCreatePrefill = {
  hour?: number
}

export function emptyAppointmentDraft(
  day: Date = new Date(),
  prefill?: AppointmentCreatePrefill
): AppointmentDraft {
  const start = new Date(day)
  start.setHours(prefill?.hour ?? 9, 0, 0, 0)

  return {
    veiculo_id: '',
    date: toDateInputValue(day),
    startTime: toTimeInputValue(start),
    problema: ''
  }
}

export function appointmentToDraft(row: {
  veiculo_id: string
  inicio: string
  observacoes?: string | null
  servico?: string | null
}): AppointmentDraft {
  return {
    veiculo_id: row.veiculo_id,
    date: toDateInputValue(new Date(row.inicio)),
    startTime: toTimeInputValue(new Date(row.inicio)),
    problema: appointmentProblem(row)
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
    errors.push({ name: 'startTime', message: 'Informe o horário' })
  }

  return errors
}

export function canMarkNoShow(status: AgendamentoStatus): boolean {
  return status === 'agendado' || status === 'confirmado'
}
