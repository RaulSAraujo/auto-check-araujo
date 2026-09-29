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

  function onVoiceDraft<K extends VoiceIntent>(intent: K, handler: (draft: VoiceDraftMap[K]) => void) {
    watch(pending, (value) => {
      if (!value) return
      if (Date.now() - value.createdAt > DRAFT_TTL_MS) {
        pending.value = null
        return
      }
      if (value.intent !== intent) return
      pending.value = null
      handler(value.draft as VoiceDraftMap[K])
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft }
}
