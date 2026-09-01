import type { ChecklistItem } from '~~/shared/types/database'

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

export function countFilledChecklistItens(itens: ChecklistItem[]): number {
  return itens.filter(i => i.resultado).length
}
