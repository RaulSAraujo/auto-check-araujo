export const TEAM_TABS = [
  'colaboradores',
  'presenca',
  'faltas',
  'avaliacoes',
  'indicadores',
  'tempo-medio',
  'ocorrencias'
] as const

export type TeamTab = (typeof TEAM_TABS)[number]

export const TEAM_TAB_DEFAULT: TeamTab = 'colaboradores'

export const TEAM_TAB_LABEL: Record<TeamTab, string> = {
  'colaboradores': 'Colaboradores',
  'presenca': 'Presença',
  'faltas': 'Faltas',
  'avaliacoes': 'Avaliações',
  'indicadores': 'Indicadores',
  'tempo-medio': 'Tempo médio',
  'ocorrencias': 'Ocorrências'
}

export const TEAM_TAB_ICON: Record<TeamTab, string> = {
  'colaboradores': 'i-lucide-users',
  'presenca': 'i-lucide-calendar-check',
  'faltas': 'i-lucide-user-x',
  'avaliacoes': 'i-lucide-star',
  'indicadores': 'i-lucide-gauge',
  'tempo-medio': 'i-lucide-timer',
  'ocorrencias': 'i-lucide-triangle-alert'
}

export const TEAM_TAB_EMPTY: Record<Exclude<TeamTab, 'colaboradores'>, {
  icon: string
  message: string
}> = {
  'presenca': {
    icon: 'i-lucide-calendar-check',
    message: 'Sem dados de presença no período.'
  },
  'faltas': {
    icon: 'i-lucide-user-x',
    message: 'Nenhuma falta no período.'
  },
  'avaliacoes': {
    icon: 'i-lucide-star',
    message: 'Nenhuma avaliação registrada.'
  },
  'indicadores': {
    icon: 'i-lucide-gauge',
    message: 'Sem dados no período.'
  },
  'tempo-medio': {
    icon: 'i-lucide-timer',
    message: 'Sem dados de tempo médio no período.'
  },
  'ocorrencias': {
    icon: 'i-lucide-triangle-alert',
    message: 'Nenhuma ocorrência registrada.'
  }
}

export function isTeamTab(value: unknown): value is TeamTab {
  return typeof value === 'string' && (TEAM_TABS as readonly string[]).includes(value)
}

export function currentTeamMonthValue(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function teamMonthBounds(month: string): { start: string, end: string } {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw)
  const lastDay = new Date(year, monthIndex, 0).getDate()
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`
  }
}

export function todayDateValue(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTeamDate(value: string): string {
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}
