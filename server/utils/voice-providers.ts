export interface VoiceProvider {
  name: string
  url: string
  apiKey: string
  model: string
  extra?: Record<string, unknown>
}

export interface VoiceProviderMessage {
  role: 'system' | 'user'
  content: string
}

interface CompleteOptions {
  fetch?: typeof fetch
  timeoutMs?: number
  onError?: (provider: string, reason: string) => void
}

function parseContent(content: string): unknown {
  return JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
}

/** Tries each configured OpenAI-compatible provider in order; any failure moves to the next one. */
export async function completeWithFallback(
  providers: VoiceProvider[],
  messages: VoiceProviderMessage[],
  options: CompleteOptions = {}
): Promise<unknown | null> {
  const doFetch = options.fetch ?? fetch
  for (const provider of providers) {
    if (!provider.apiKey) continue
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
          temperature: 0,
          response_format: { type: 'json_object' },
          ...provider.extra
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000)
      })
      if (!response.ok) {
        options.onError?.(provider.name, `HTTP ${response.status}`)
        continue
      }
      const body = await response.json() as { choices?: { message?: { content?: string } }[] }
      const content = body.choices?.[0]?.message?.content
      if (!content) {
        options.onError?.(provider.name, 'empty response')
        continue
      }
      return parseContent(content)
    } catch (error) {
      options.onError?.(provider.name, error instanceof Error ? error.message : String(error))
    }
  }
  return null
}
