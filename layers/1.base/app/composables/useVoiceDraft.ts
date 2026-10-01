import type { VoiceCurrentMap } from '../utils/voice/current'
import type { VoiceDraft } from '../utils/voice/types'

export type { VoiceCurrent } from '../utils/voice/current'

type PendingVoiceDraft = { draft: VoiceDraft, createdAt: number }

const DRAFT_TTL_MS = 15_000

export function useVoiceDraft() {
  const pending = useState<PendingVoiceDraft | null>('voice-draft', () => null)
  /** Record open on screen per entity (detail page or edit slideover), used when a command has no target. */
  const current = useState<VoiceCurrentMap>('voice-current', () => ({}))

  function setVoiceDraft(draft: VoiceDraft) {
    pending.value = { draft, createdAt: Date.now() }
  }

  function clearVoiceDraft() {
    pending.value = null
  }

  /** `handles` lets several registrations share an entity (e.g. the order page and its photos section). */
  function onVoiceDraft(
    handles: (draft: VoiceDraft) => boolean,
    handler: (draft: VoiceDraft) => void,
    options?: { ready?: () => boolean }
  ) {
    watch([pending, () => options?.ready?.() ?? true], ([value, ready]) => {
      if (!value) return
      if (Date.now() - value.createdAt > DRAFT_TTL_MS) {
        pending.value = null
        return
      }
      if (!handles(value.draft)) return
      // Lazy queries: wait for the record so form-sync watchers (registered earlier) run first.
      if (!ready) return
      pending.value = null
      handler(value.draft)
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft, current }
}
