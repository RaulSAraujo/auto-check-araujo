import type { VoiceProvider } from '../voice-providers.ts'

export interface ToolSchema {
  type: 'function'
  function: { name: string, description: string, parameters: Record<string, unknown> }
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string, arguments: string }
}

export type AskMessage
  = | { role: 'system' | 'user', content: string }
    | { role: 'assistant', content: string | null, tool_calls?: ToolCall[] }
    | { role: 'tool', tool_call_id: string, content: string }

interface AskOptions {
  providers: VoiceProvider[]
  messages: AskMessage[]
  tools: ToolSchema[]
  execute: (name: string, args: unknown) => Promise<unknown>
  fetch?: typeof fetch
  callTimeoutMs?: number
  totalTimeoutMs?: number
  onError?: (provider: string, reason: string) => void
}

type ModelMessage = { content?: string | null, tool_calls?: ToolCall[] }

const MAX_DATA_ROUNDS = 3
const MAX_CALLS_PER_ROUND = 5
const MAX_ANSWER = 1000

const FINAL_ANSWER: ToolSchema = {
  type: 'function',
  function: {
    name: 'final_answer',
    description: 'Entrega a resposta final ao usuário, quando já tiver os dados (ou souber que não há).',
    parameters: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Resposta curta em português para ser falada, até 3 frases.' },
        refs: {
          type: 'array',
          description: 'Registros citados na resposta, com type e id exatos vindos das ferramentas.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['order', 'customer', 'vehicle', 'appointment', 'account'] },
              id: { type: 'string' }
            },
            required: ['type', 'id']
          }
        }
      },
      required: ['answer']
    }
  }
}

function parseArgs(raw: string | undefined): unknown {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return undefined
  }
}

async function complete(options: AskOptions, messages: AskMessage[], toolChoice: unknown, deadline: number): Promise<ModelMessage | null> {
  const doFetch = options.fetch ?? fetch
  for (const provider of options.providers) {
    if (!provider.apiKey) continue
    const left = deadline - Date.now()
    if (left <= 0) return null
    try {
      const response = await doFetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          tools: [...options.tools, FINAL_ANSWER],
          tool_choice: toolChoice,
          temperature: 0,
          ...provider.extra
        }),
        signal: AbortSignal.timeout(Math.min(options.callTimeoutMs ?? 8_000, left))
      })
      if (!response.ok) {
        await response.body?.cancel()
        options.onError?.(provider.name, `HTTP ${response.status}`)
        continue
      }
      const body = await response.json() as { choices?: { message?: ModelMessage }[] }
      const message = body.choices?.[0]?.message
      if (!message?.tool_calls?.length && !message?.content?.trim()) {
        options.onError?.(provider.name, 'empty response')
        continue
      }
      return message
    } catch (error) {
      options.onError?.(provider.name, error instanceof Error ? error.message : String(error))
    }
  }
  return null
}

/** Tool-calling loop: up to 3 data rounds, then `final_answer` is forced. Null when every provider fails. */
export async function askWithTools(options: AskOptions): Promise<{ answer: string, refs: unknown } | null> {
  const deadline = Date.now() + (options.totalTimeoutMs ?? 25_000)
  const messages = [...options.messages]
  for (let round = 0; round <= MAX_DATA_ROUNDS; round++) {
    const toolChoice = round === MAX_DATA_ROUNDS ? { type: 'function', function: { name: 'final_answer' } } : 'required'
    const message = await complete(options, messages, toolChoice, deadline)
    if (!message) return null

    const calls = (message.tool_calls ?? []).slice(0, MAX_CALLS_PER_ROUND)
    const final = calls.find(item => item.function?.name === 'final_answer')
    if (final) {
      const args = parseArgs(final.function.arguments) as { answer?: unknown, refs?: unknown } | undefined
      const answer = typeof args?.answer === 'string' ? args.answer.trim().slice(0, MAX_ANSWER) : ''
      return answer ? { answer, refs: args?.refs } : null
    }
    if (!calls.length) {
      const answer = message.content?.trim().slice(0, MAX_ANSWER)
      return answer ? { answer, refs: [] } : null
    }

    messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: calls })
    for (const item of calls) {
      const args = parseArgs(item.function?.arguments)
      const result = args === undefined
        ? { erro: 'argumento_invalido', campo: 'json' }
        : await options.execute(item.function.name, args)
      messages.push({ role: 'tool', tool_call_id: item.id, content: JSON.stringify(result) })
    }
  }
  return null
}
