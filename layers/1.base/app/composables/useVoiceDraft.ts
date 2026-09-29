import type { VoiceDraftMap, VoiceIntent } from '../utils/voice/types'

type PendingVoiceDraft = { intent: VoiceIntent, draft: VoiceDraftMap[VoiceIntent], createdAt: number }

const DRAFT_TTL_MS = 15_000

export function useVoiceDraft() {
  const pending = useState<PendingVoiceDraft | null>('voice-draft', () => null)

  function setVoiceDraft<K extends VoiceIntent>(intent: K, draft: VoiceDraftMap[K]) {
    pending.value = { intent, draft, createdAt: Date.now() }
  }

  function clearVoiceDraft() {
    pending.value = null
  }

  function onVoiceDraft<K extends VoiceIntent>(
    intent: K,
    handler: (draft: VoiceDraftMap[K]) => void,
    options?: { accept?: (draft: VoiceDraftMap[K]) => boolean, ready?: () => boolean }
  ) {
    watch([pending, () => options?.ready?.() ?? true], ([value, ready]) => {
      if (!value) return
      if (Date.now() - value.createdAt > DRAFT_TTL_MS) {
        pending.value = null
        return
      }
      if (value.intent !== intent) return
      const draft = value.draft as VoiceDraftMap[K]
      // Another page instance (e.g. the previous record during navigation) must not swallow the draft.
      if (options?.accept && !options.accept(draft)) return
      // Lazy queries: wait for the record so form-sync watchers (registered earlier) run first.
      if (!ready) return
      pending.value = null
      handler(draft)
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft }
}
