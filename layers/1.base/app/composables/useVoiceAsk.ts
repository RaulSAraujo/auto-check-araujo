import { voiceAiFailure } from '../utils/voice/ai-failure'
import { localDateInput } from '../utils/voice/prompt'

export interface VoiceAskLink {
  label: string
  to: string
}

export interface VoiceAskMessage {
  role: 'user' | 'assistant' | 'error'
  content: string
  refs?: VoiceAskLink[]
}

type HistoryMessage = { role: 'user' | 'assistant', content: string }

const MUTE_KEY = 'voice-ask-muted'
const MAX_HISTORY = 10
const ERROR_TEXT = 'Não consegui responder agora. Tente de novo.'

/** Short conversation about the shop's data; lives until `reset` (panel closed). */
export function useVoiceAsk() {
  const messages = ref<VoiceAskMessage[]>([])
  const pending = ref(false)
  const muted = ref(false)
  // Assistant turns hold the masked answer the server returned, never the revealed one.
  let history: HistoryMessage[] = []
  let controller: AbortController | undefined

  onMounted(() => {
    try {
      muted.value = localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      // Storage blocked (private mode): the toggle still works for this session.
    }
  })

  function canSpeak() {
    return import.meta.client && 'speechSynthesis' in window
  }

  function stopSpeaking() {
    if (canSpeak()) window.speechSynthesis.cancel()
  }

  function speak(text: string) {
    if (muted.value || !canSpeak()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    window.speechSynthesis.speak(utterance)
  }

  function toggleMute() {
    muted.value = !muted.value
    if (muted.value) stopSpeaking()
    try {
      localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0')
    } catch {
      // Storage blocked: keep the in-memory choice.
    }
  }

  function cancel() {
    if (controller && messages.value.at(-1)?.role === 'user') messages.value.pop()
    controller?.abort()
    controller = undefined
    pending.value = false
  }

  function reset() {
    cancel()
    stopSpeaking()
    messages.value = []
    history = []
  }

  async function ask(question: string): Promise<boolean> {
    cancel()
    stopSpeaking()
    // A resend replaces the failed attempt instead of stacking it.
    if (messages.value.at(-1)?.role === 'error') messages.value.splice(-2)
    const current = new AbortController()
    controller = current
    messages.value.push({ role: 'user', content: question })
    pending.value = true
    const turn: HistoryMessage[] = [...history, { role: 'user' as const, content: question }].slice(-MAX_HISTORY)
    try {
      const response = await $fetch<{ answer: string, refs: VoiceAskLink[], history: string }>('/api/voice/ask', {
        method: 'POST',
        body: { messages: turn, today: localDateInput(new Date()) },
        signal: current.signal,
        // Server budget is 25 s for the whole tool loop.
        timeout: 30_000
      })
      if (current !== controller) return false
      history = [...turn, { role: 'assistant' as const, content: response.history }].slice(-MAX_HISTORY)
      messages.value.push({ role: 'assistant', content: response.answer, refs: response.refs })
      speak(response.answer)
      return true
    } catch (error) {
      if (current !== controller) return false
      messages.value.push({ role: 'error', content: voiceAiFailure(error, ERROR_TEXT) })
      return false
    } finally {
      if (current === controller) {
        pending.value = false
        controller = undefined
      }
    }
  }

  onScopeDispose(reset)

  return { messages, pending, muted, ask, cancel, reset, stopSpeaking, toggleMute }
}
