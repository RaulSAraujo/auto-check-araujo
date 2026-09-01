export {
  CHECKLIST_RESULTADO_LABEL,
  ORDEM_STATUS_COLOR,
  ORDEM_STATUS_LABEL
} from '~~/shared/types/oficina'
export type { ChecklistResultado, OrdemStatus } from '~~/shared/types/oficina'

/** Normaliza placa para 7 caracteres alfanuméricos em maiúsculas. */
export function normalizePlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function formatPlaca(placa: string): string {
  const n = normalizePlaca(placa)
  if (n.length === 7) {
    return `${n.slice(0, 3)}-${n.slice(3)}`
  }
  return placa
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}
