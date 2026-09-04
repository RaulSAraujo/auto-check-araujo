import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'

export const CHECKLIST_RESULTADO_OPTIONS: {
  value: ChecklistResultado
  label: string
  shortLabel: string
  color: 'success' | 'error' | 'neutral'
}[] = [
  { value: 'ok', label: 'OK', shortLabel: 'OK', color: 'success' },
  { value: 'ruim', label: 'Ruim', shortLabel: 'Ruim', color: 'error' },
  { value: 'na', label: 'N/A', shortLabel: 'N/A', color: 'neutral' }
]

export function needsChecklistObservacao(resultado: string | null): boolean {
  return resultado === 'ruim' || resultado === 'atencao'
}

export function hasChecklistItemEvidence(
  observacao: string | null | undefined,
  photoCount: number
): boolean {
  return Boolean(observacao?.trim()) || photoCount > 0
}

export function confirmClearChecklistEvidence(options: {
  hasObservacao: boolean
  photoCount: number
}): boolean {
  const { hasObservacao, photoCount } = options

  let message: string
  if (hasObservacao && photoCount > 0) {
    message = `Ao mudar o resultado, a observação e ${photoCount} foto${photoCount === 1 ? '' : 's'} deste item serão apagadas. Continuar?`
  } else if (photoCount > 0) {
    message = photoCount === 1
      ? 'Ao mudar o resultado, a foto deste item será apagada. Continuar?'
      : `Ao mudar o resultado, ${photoCount} fotos deste item serão apagadas. Continuar?`
  } else {
    message = 'Ao mudar o resultado, a observação deste item será apagada. Continuar?'
  }

  return window.confirm(message)
}

export function checklistResultadoColor(
  resultado: string | null
): 'success' | 'warning' | 'error' | 'neutral' {
  if (resultado === 'ok') return 'success'
  if (resultado === 'atencao') return 'warning'
  if (resultado === 'ruim') return 'error'
  return 'neutral'
}

export function groupChecklistItensByCategoria(
  itens: ChecklistItem[]
): [string, ChecklistItem[]][] {
  const map = new Map<string, ChecklistItem[]>()
  for (const item of itens) {
    const list = map.get(item.categoria) || []
    list.push(item)
    map.set(item.categoria, list)
  }
  return [...map.entries()]
}

export function countFilledChecklistItens(itens: { resultado: string | null }[]): number {
  return itens.filter(i => i.resultado).length
}

export interface ChecklistItemDraft {
  categoria: string
  label: string
}

export function emptyChecklistItemDraft(): ChecklistItemDraft {
  return { categoria: '', label: '' }
}

export function isChecklistItemDraftValid(draft: ChecklistItemDraft): boolean {
  return draft.categoria.trim().length > 0 && draft.label.trim().length > 0
}

export function collectChecklistCategorias(itens: { categoria: string }[]): string[] {
  const seen = new Set<string>()
  for (const item of itens) {
    const categoria = item.categoria.trim()
    if (categoria) seen.add(categoria)
  }
  return [...seen]
}
