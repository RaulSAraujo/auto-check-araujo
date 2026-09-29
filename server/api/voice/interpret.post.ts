import { serverSupabaseUser } from '#supabase/server'
import { buildVoiceMessages } from '~~/layers/1.base/app/utils/voice/prompt'
import { normalizeVoiceCommand } from '~~/layers/1.base/app/utils/voice/normalize'
import type { VoicePage } from '~~/layers/1.base/app/utils/voice/types'
import { completeWithFallback } from '../../utils/voice-providers'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const PAGES: readonly VoicePage[] = ['order-detail', 'customer-detail', 'vehicle-detail', 'scheduling', 'other']
const MAX_TEXT = 2000

type InterpretBody = {
  text?: unknown
  context?: { page?: unknown, today?: unknown }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody<InterpretBody>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const rawPage = body?.context?.page
  const page: VoicePage = PAGES.includes(rawPage as VoicePage) ? rawPage as VoicePage : 'other'
  const rawToday = body?.context?.today
  const today = typeof rawToday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawToday) ? rawToday : ''

  if (!text || text.length > MAX_TEXT || !today) {
    throw createError({ statusCode: 400, message: 'Comando inválido' })
  }

  const config = useRuntimeConfig(event)
  const raw = await completeWithFallback(
    [
      { name: 'groq', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqModel, extra: { reasoning_effort: 'low' } },
      { name: 'groq-fallback', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqFallbackModel, extra: { reasoning_effort: 'low' } },
      { name: 'gemini', url: GEMINI_URL, apiKey: config.geminiApiKey, model: config.geminiModel }
    ],
    buildVoiceMessages(text, { page, today }),
    { timeoutMs: 8_000, onError: (provider, reason) => console.warn(`[voice] ${provider} failed: ${reason}`) }
  )

  if (raw === null) {
    throw createError({ statusCode: 503, message: 'Interpretação por IA indisponível' })
  }

  return { command: normalizeVoiceCommand(raw) }
})
