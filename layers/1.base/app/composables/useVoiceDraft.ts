import type { VoiceDraftMap, VoiceIntent } from '../utils/voice/types'

type PendingVoiceDraft = { intent: VoiceIntent, draft: VoiceDraftMap[VoiceIntent] }

export function useVoiceDraft() {
  const pending = useState<PendingVoiceDraft | null>('voice-draft', () => null)

  function setVoiceDraft<K extends VoiceIntent>(intent: K, draft: VoiceDraftMap[K]) {
    pending.value = { intent, draft }
  }

  function clearVoiceDraft() {
    pending.value = null
  }

  function onVoiceDraft<K extends VoiceIntent>(intent: K, handler: (draft: VoiceDraftMap[K]) => void) {
    watch(pending, (value) => {
      if (!value || value.intent !== intent) return
      pending.value = null
      handler(value.draft as VoiceDraftMap[K])
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft }
}
