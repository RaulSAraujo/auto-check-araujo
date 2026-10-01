import type { Ref, watch as vueWatch } from 'vue'
import type { VoiceEntityKey } from './types.ts'

export interface VoiceCurrent { id: string, label?: string }
export type VoiceCurrentMap = Partial<Record<VoiceEntityKey, VoiceCurrent>>

/**
 * Publishes the record open on screen for `key` and returns its cleanup.
 * `current` is written only in the callback: tracking it would make two live screens re-trigger each other.
 * The cleanup keeps the entry if the next screen (registered before this one unmounts) already replaced it.
 */
export function trackVoiceCurrent(
  watch: typeof vueWatch,
  current: Ref<VoiceCurrentMap>,
  key: VoiceEntityKey,
  id: () => string | undefined,
  label?: () => string | undefined
): () => void {
  let ownId: string | undefined
  watch([id, () => label?.()], ([nextId, nextLabel]) => {
    ownId = nextId
    current.value = { ...current.value, [key]: nextId ? { id: nextId, label: nextLabel } : undefined }
  }, { immediate: true })
  return () => {
    if (ownId && current.value[key]?.id === ownId) current.value = { ...current.value, [key]: undefined }
  }
}
