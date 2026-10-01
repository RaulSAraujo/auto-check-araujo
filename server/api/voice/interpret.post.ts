import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { VOICE_CATALOG } from '~~/layers/1.base/app/utils/voice/catalog'
import { buildVoiceMessages, VOICE_PAGES } from '~~/layers/1.base/app/utils/voice/prompt'
import { normalizeVoiceCommand } from '~~/layers/1.base/app/utils/voice/normalize'
import type { VoicePage } from '~~/layers/1.base/app/utils/voice/types'
import type { Database } from '~~/shared/types/database'
import { aiFailureStatus, completeWithFallback } from '../../utils/voice-providers'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MAX_TEXT = 2000
// ponytail: the whole active catalog goes in the prompt; past this size switch to a lookup tool instead of cutting names.
const MAX_CATALOG = 200

/** Lets the AI say budget items with their exact catalog names; without it the command still works, just fuzzier. */
async function catalogItems(event: H3Event): Promise<string[] | undefined> {
  const db = await serverSupabaseClient<Database>(event)
  const { data } = await db.from('servicos_catalogo').select('nome, tipo').eq('ativo', true).order('nome').limit(MAX_CATALOG)
  return data?.map(row => `${row.nome} (${row.tipo})`)
}

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
  const page: VoicePage = VOICE_PAGES.includes(rawPage as VoicePage) ? rawPage as VoicePage : 'other'
  const rawToday = body?.context?.today
  const today = typeof rawToday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawToday) ? rawToday : ''

  if (!text || text.length > MAX_TEXT || !today) {
    throw createError({ statusCode: 400, message: 'Comando inválido' })
  }

  const catalog = VOICE_CATALOG.order.pages.includes(page) ? await catalogItems(event) : undefined
  const config = useRuntimeConfig(event)
  const failures: string[] = []
  const raw = await completeWithFallback(
    [
      { name: 'groq', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqModel, extra: { reasoning_effort: 'low' } },
      { name: 'groq-fallback', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqFallbackModel, extra: { reasoning_effort: 'low' } },
      { name: 'gemini', url: GEMINI_URL, apiKey: config.geminiApiKey, model: config.geminiModel }
    ],
    buildVoiceMessages(text, { page, today, catalog }),
    {
      timeoutMs: 8_000,
      onError: (provider, reason) => {
        failures.push(reason)
        console.warn(`[voice] ${provider} failed: ${reason}`)
      }
    }
  )

  if (raw === null) {
    throw createError({ statusCode: aiFailureStatus(failures), message: 'Interpretação por IA indisponível' })
  }

  return { command: normalizeVoiceCommand(raw) }
})
