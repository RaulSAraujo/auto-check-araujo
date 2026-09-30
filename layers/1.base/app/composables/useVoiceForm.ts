import { applyVoiceFields } from '../utils/voice/apply'
import { VOICE_CATALOG, voiceConfirmText } from '../utils/voice/catalog'
import type { VoiceDraft, VoiceEntityKey, VoiceRecord, VoiceValue } from '../utils/voice/types'

type MaybePromise<T> = T | Promise<T>
export type VoiceActionResult = { unavailable?: string, message?: string } | undefined

export interface VoiceFormOptions {
  /** Form drafts this screen takes. Default: create and edit. */
  ops?: readonly ('create' | 'edit')[]
  /** Form state written by `applyVoiceFields`. */
  state?: Record<string, unknown>
  format?: Record<string, (value: VoiceValue) => unknown>
  /** Prepares the form before fields are applied (startEdit, openCreate, openEdit by id). */
  open?: (draft: VoiceDraft) => MaybePromise<void>
  /** Replaces open + state for screens whose form needs special handling. */
  apply?: (draft: VoiceDraft) => MaybePromise<void>
  onItems?: (items: VoiceRecord[], draft: VoiceDraft) => MaybePromise<void>
  actions?: Record<string, (draft: VoiceDraft) => MaybePromise<VoiceActionResult> | MaybePromise<void>>
  /** Reason the action can't run now; checked before asking for confirmation. */
  unavailable?: (action: string, draft: VoiceDraft) => string | undefined
  currentId?: () => string | undefined
  label?: () => string | undefined
  accept?: (draft: VoiceDraft) => boolean
  ready?: () => boolean
}

export function useVoiceForm(entityKey: VoiceEntityKey, options: VoiceFormOptions) {
  const entity = VOICE_CATALOG[entityKey]
  const toast = useToast()
  const { onVoiceDraft, current } = useVoiceDraft()
  const { confirmVoice } = useVoiceConfirm()
  const ops = options.ops ?? ['create', 'edit']
  const takesForms = !!(options.state || options.apply || options.onItems)

  if (options.currentId) {
    let ownId: string | undefined
    watchEffect(() => {
      ownId = options.currentId?.()
      current.value = { ...current.value, [entityKey]: ownId ? { id: ownId, label: options.label?.() } : undefined }
    })
    // The next page (e.g. another record of the same entity) may have registered before this one unmounts.
    onScopeDispose(() => {
      if (ownId && current.value[entityKey]?.id === ownId) current.value = { ...current.value, [entityKey]: undefined }
    })
  }

  function handles(draft: VoiceDraft): boolean {
    if (draft.entity !== entityKey) return false
    if (options.accept && !options.accept(draft)) return false
    if (draft.op === 'action') return !!draft.action && !!options.actions?.[draft.action]
    return takesForms && ops.includes(draft.op)
  }

  async function runAction(draft: VoiceDraft) {
    const name = draft.action!
    const action = entity.actions[name]
    const handler = options.actions?.[name]
    if (!action || !handler) return
    const reason = options.unavailable?.(name, draft)
    if (reason) {
      toast.add({ title: reason, color: 'warning' })
      return
    }
    if (action.kind === 'confirm') {
      const label = draft.label ?? options.label?.()
      const ok = await confirmVoice({ title: voiceConfirmText(action.confirm ?? name, { ...draft.args, label }) })
      if (!ok) return
    }
    const result = await handler(draft) as VoiceActionResult
    if (result?.unavailable) toast.add({ title: result.unavailable, color: 'warning' })
    else if (result?.message) toast.add({ title: result.message, color: 'info', icon: 'i-lucide-mic' })
  }

  async function applyForm(draft: VoiceDraft) {
    if (options.apply) {
      await options.apply(draft)
    } else {
      await options.open?.(draft)
      if (options.state && Object.keys(draft.fields).length) {
        applyVoiceFields(options.state, draft.fields, entity, { format: options.format })
      }
    }
    if (draft.items?.length && options.onItems) await options.onItems(draft.items, draft)
  }

  onVoiceDraft(handles, (draft) => {
    const work = draft.op === 'action' ? runAction(draft) : applyForm(draft)
    work.catch(() => toast.add({ title: 'Não foi possível aplicar o comando de voz.', color: 'error' }))
  }, { ready: options.ready })
}
