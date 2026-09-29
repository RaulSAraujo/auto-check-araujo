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
  let lastChunk = ''

  onMounted(() => {
    supported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  })

  function emitChunk(text: string) {
    const chunk = text.trim()
    // Android Chrome may repeat the previous final result in continuous mode.
    if (!chunk || chunk === lastChunk) return
    lastChunk = chunk
    chunkCallbacks.forEach(cb => cb(chunk))
  }

  function start() {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) return

    recognition?.abort()
    interim.value = ''
    error.value = null
    lastChunk = ''
    keepListening = true

    const instance = new Recognition()
    instance.lang = 'pt-BR'
    instance.interimResults = true
    instance.continuous = true
    instance.maxAlternatives = 1

    instance.onresult = (event) => {
      if (recognition !== instance) return
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result?.[0]?.transcript ?? ''
        if (result?.isFinal) emitChunk(text)
        else pending += text
      }
      interim.value = pending.trim()
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
