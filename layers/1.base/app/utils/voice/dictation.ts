import type { VoiceCommand, VoicePage } from './types'

const FIELD: Record<string, string> = { d: 'diagnostico', r: 'reclamacao', o: 'observacoes' }

// Label, optional punctuation, optional leading "problema", then the dictated text.
const DICTATION = /^\s*(diagn[oó]stico|reclama[cç][aã]o|observa[cç](?:[aã]o|[oõ]es))\b[\s,:;.-]*(?:problemas?\b[\s,:;.-]*)?(.+?)[\s.]*$/i

/** "diagnóstico falta de revisão e alinhamento" on an open OS: the whole rest is the field text, no AI guess. */
export function dictatedField(text: string, page: VoicePage): VoiceCommand | null {
  if (page !== 'order-detail') return null
  const match = DICTATION.exec(text)
  if (!match) return null
  const value = match[2]!.charAt(0).toUpperCase() + match[2]!.slice(1)
  return { op: 'edit', entity: 'order', fields: { [FIELD[match[1]!.charAt(0).toLowerCase()]!]: value } }
}
