interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
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
  if (code === 'no-speech') return 'Não ouvi nada. Tente de novo.'
  if (code === 'aborted') return null
  return 'Não foi possível usar o microfone.'
}

export function useSpeechRecognition() {
  const supported = ref(false)
  const listening = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)
  const finalCallbacks: Array<(text: string) => void> = []
  let recognition: SpeechRecognitionLike | null = null

  onMounted(() => {
    supported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  })

  function start() {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) return

    recognition?.abort()
    transcript.value = ''
    error.value = null

    const instance = new Recognition()
    instance.lang = 'pt-BR'
    instance.interimResults = true
    instance.continuous = false
    instance.maxAlternatives = 1

    instance.onresult = (event) => {
      if (recognition !== instance) return
      transcript.value = Array.from(event.results, result => result[0]?.transcript ?? '').join('')
    }
    instance.onerror = (event) => {
      if (recognition !== instance) return
      error.value = errorMessage(event.error)
    }
    instance.onend = () => {
      if (recognition !== instance) return
      recognition = null
      listening.value = false
      const text = transcript.value.trim()
      if (!error.value && text) finalCallbacks.forEach(cb => cb(text))
    }

    recognition = instance
    listening.value = true
    try {
      instance.start()
    } catch {
      recognition = null
      listening.value = false
      error.value = errorMessage('')
    }
  }

  function stop() {
    recognition?.stop()
  }

  function cancel() {
    const r = recognition
    recognition = null
    r?.abort()
    listening.value = false
  }

  function onFinal(cb: (text: string) => void) {
    finalCallbacks.push(cb)
  }

  onScopeDispose(() => {
    finalCallbacks.length = 0
    recognition?.abort()
  })

  return { supported, listening, transcript, error, start, stop, cancel, onFinal }
}
