import { mergeFinalResults } from '../utils/voice/text'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0?: { transcript: string }
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

function errorMessage(code: string): string | null {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return 'Permita o acesso ao microfone para usar comandos de voz.'
  }
  if (code === 'aborted' || code === 'no-speech') return null
  if (code === 'network') return 'Sem conexão para reconhecer a fala. Digite o comando.'
  return 'Não foi possível usar o microfone.'
}

export function useSpeechRecognition() {
  const supported = ref(false)
  const listening = ref(false)
  const interim = ref('')
  const error = ref<string | null>(null)
  const chunkCallbacks: Array<(text: string) => void> = []
  let recognition: SpeechRecognitionLike | null = null
  let keepListening = false
  /** Final text of the current session already handed to `onChunk`. */
  let emitted = ''

  onMounted(() => {
    supported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  })

  function withoutPrefix(text: string, prefix: string): string | undefined {
    return prefix && text.toLowerCase().startsWith(prefix.toLowerCase()) ? text.slice(prefix.length).trim() : undefined
  }

  function handleResults(results: ArrayLike<SpeechRecognitionResultLike>) {
    const finals: string[] = []
    let pending = ''
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const text = result?.[0]?.transcript ?? ''
      if (result?.isFinal) finals.push(text)
      else pending += text
    }
    const merged = mergeFinalResults(finals)
    // A rewrite of text already emitted is dropped: re-sending it would duplicate words in the modal.
    const chunk = emitted ? withoutPrefix(merged, emitted) ?? '' : merged
    emitted = merged
    if (chunk) chunkCallbacks.forEach(cb => cb(chunk))
    const trimmed = pending.trim()
    interim.value = withoutPrefix(trimmed, merged) ?? trimmed
  }

  function start() {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) return

    recognition?.abort()
    interim.value = ''
    error.value = null
    emitted = ''
    keepListening = true

    const instance = new Recognition()
    instance.lang = 'pt-BR'
    instance.interimResults = true
    instance.continuous = true
    instance.maxAlternatives = 1

    instance.onresult = (event) => {
      if (recognition === instance) handleResults(event.results)
    }
    instance.onerror = (event) => {
      if (recognition !== instance) return
      if (event.error !== 'no-speech') keepListening = false
      const message = errorMessage(event.error)
      if (message) error.value = message
    }
    instance.onend = () => {
      if (recognition !== instance) return
      interim.value = ''
      // Browsers end continuous sessions on silence/timeouts; resume until the user stops.
      if (keepListening) {
        try {
          emitted = ''
          instance.start()
          return
        } catch {
          keepListening = false
        }
      }
      recognition = null
      listening.value = false
    }

    recognition = instance
    listening.value = true
    try {
      instance.start()
    } catch {
      recognition = null
      listening.value = false
      keepListening = false
      error.value = errorMessage('')
    }
  }

  function stop() {
    keepListening = false
    recognition?.stop()
  }

  function cancel() {
    keepListening = false
    const r = recognition
    recognition = null
    r?.abort()
    listening.value = false
    interim.value = ''
  }

  function onChunk(cb: (text: string) => void) {
    chunkCallbacks.push(cb)
  }

  onScopeDispose(() => {
    chunkCallbacks.length = 0
    cancel()
  })

  return { supported, listening, interim, error, start, stop, cancel, onChunk }
}
