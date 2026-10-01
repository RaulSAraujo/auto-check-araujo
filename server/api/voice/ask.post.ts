import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database'
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import { askWithTools, type AskMessage } from '../../utils/voice-ask/loop'
import { createMasker } from '../../utils/voice-ask/mask'
import { buildAskSystemPrompt } from '../../utils/voice-ask/prompt'
import { createRefs } from '../../utils/voice-ask/refs'
import { runVoiceTool, VOICE_TOOL_SCHEMAS } from '../../utils/voice-ask/tools'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_MESSAGES = 10
const MAX_CONTENT = 2000
const PAPEIS: readonly ColaboradorPapel[] = ['recepcao', 'mecanico', 'gerente']
const UNAVAILABLE = 'Não consegui responder agora. Tente de novo.'

type ChatMessage = { role: 'user' | 'assistant', content: string }

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null
  const messages = raw.slice(-MAX_MESSAGES)
  const valid = messages.every(item =>
    item && typeof item === 'object'
    && (item.role === 'user' || item.role === 'assistant')
    && typeof item.content === 'string'
    && item.content.trim()
    && item.content.length <= MAX_CONTENT
  )
  if (!valid || messages.at(-1)?.role !== 'user') return null
  return messages.map(item => ({ role: item.role, content: item.content.trim() }))
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody<{ messages?: unknown, today?: unknown }>(event)
  const messages = parseMessages(body?.messages)
  const today = typeof body?.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : ''
  if (!messages || !today) {
    throw createError({ statusCode: 400, message: 'Pergunta inválida' })
  }

  const db = await serverSupabaseClient<Database>(event)
  const { data: profile } = await db.from('profiles').select('papel').eq('id', user.sub).single()
  const papel = PAPEIS.find(value => value === profile?.papel)
  if (!papel) {
    throw createError({ statusCode: 403, message: 'Sem perfil' })
  }

  const masker = createMasker(messages.map(item => item.content))
  const refs = createRefs()
  const config = useRuntimeConfig(event)
  const conversation: AskMessage[] = [
    { role: 'system', content: buildAskSystemPrompt({ today, papel }) },
    ...messages.map(item => ({ role: item.role, content: masker.maskText(item.content) }))
  ]

  const result = await askWithTools({
    providers: [
      { name: 'groq', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqModel, extra: { reasoning_effort: 'low' } },
      { name: 'groq-fallback', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqFallbackModel, extra: { reasoning_effort: 'low' } }
    ],
    messages: conversation,
    tools: VOICE_TOOL_SCHEMAS,
    execute: async (name, args) => masker.maskResult(await runVoiceTool(name, masker.unmaskArgs(args), { db, papel, today, see: refs.add })),
    onError: (provider, reason) => console.warn(`[voice-ask] ${provider} failed: ${reason}`)
  })

  if (!result) {
    throw createError({ statusCode: 503, message: UNAVAILABLE })
  }

  return { answer: masker.unmask(result.answer), refs: refs.links(result.refs), history: result.answer }
})
