export interface VoiceConfirmRequest {
  title: string
  description?: string
  confirmLabel?: string
}

// ponytail: one pending confirmation at a time; a new request resolves the previous one as cancelled.
let resolver: ((ok: boolean) => void) | null = null

export function useVoiceConfirm() {
  const request = useState<VoiceConfirmRequest | null>('voice-confirm', () => null)

  function confirmVoice(next: VoiceConfirmRequest): Promise<boolean> {
    resolver?.(false)
    request.value = next
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function settle(ok: boolean) {
    const resolve = resolver
    resolver = null
    request.value = null
    resolve?.(ok)
  }

  return { request, confirmVoice, settle }
}
