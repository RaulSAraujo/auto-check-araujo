import type { VoiceEntity } from './catalog.ts'
import { appendText, foldText } from './text.ts'
import type { VoiceBudgetItemDraft, VoiceItemTipo, VoiceRecord, VoiceValue } from './types.ts'

type Format = (value: VoiceValue) => unknown

function listKey(value: unknown): string {
  return foldText(String(value)).replace(/[\s().-]/g, '')
}

/**
 * Writes voice fields into a screen's form state following the catalog merge rules.
 * `only` restricts to some fields (a screen with several forms); `format` adapts a value to the form (e.g. phone mask).
 * Returns the state keys written.
 */
export function applyVoiceFields(
  state: Record<string, unknown>,
  fields: VoiceRecord,
  entity: VoiceEntity,
  options: { only?: readonly string[], format?: Record<string, Format> } = {}
): string[] {
  const written: string[] = []
  for (const [key, value] of Object.entries(fields)) {
    const field = entity.fields[key]
    if (!field || (options.only && !options.only.includes(key))) continue
    const stateKey = field.stateKey ?? key
    const format = options.format?.[key] ?? ((v: VoiceValue) => v)
    const merge = field.merge ?? (field.list ? 'add' : 'replace')
    if (merge === 'append' && typeof value === 'string') {
      state[stateKey] = appendText(state[stateKey] as string | null | undefined, value)
    } else if (merge === 'add' && Array.isArray(value)) {
      const current = (Array.isArray(state[stateKey]) ? state[stateKey] as unknown[] : []).filter(v => String(v ?? '').trim())
      const seen = new Set(current.map(listKey))
      const added = value.filter((v) => {
        const k = listKey(v)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      state[stateKey] = [...current, ...added.map(v => format(v))]
    } else {
      state[stateKey] = format(value)
    }
    written.push(stateKey)
  }
  return written
}

/** Budget item record (already normalized and with `catalogItemId` resolved) in the shape the order screen uses. */
export function voiceBudgetItem(item: VoiceRecord): VoiceBudgetItemDraft {
  const draft: VoiceBudgetItemDraft = { tipo: (item.tipo as VoiceItemTipo | undefined) ?? 'servico' }
  if (typeof item.descricao === 'string') draft.descricao = item.descricao
  if (typeof item.quantidade === 'number') draft.quantidade = item.quantidade
  if (typeof item.valor_unitario === 'number') draft.valor_unitario = item.valor_unitario
  if (typeof item.catalogItemId === 'string') draft.catalogItemId = item.catalogItemId
  return draft
}
