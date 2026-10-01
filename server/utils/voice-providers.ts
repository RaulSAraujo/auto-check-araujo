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

/**
 * HTTP status telling the client why every provider failed, from the `onError` reasons:
 * 429 = free-tier quota hit, 502 = key rejected or missing (no provider was even tried), 503 = anything else.
 */
export function aiFailureStatus(reasons: string[]): 429 | 502 | 503 {
  if (reasons.includes('HTTP 429')) return 429
  if (!reasons.length || reasons.includes('HTTP 401') || reasons.includes('HTTP 403')) return 502
  return 503
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
        await response.body?.cancel()
        options.onError?.(provider.name, `HTTP ${response.status}`)
        continue
      }
      const body = await response.json() as { choices?: { message?: { content?: string } }[] }
      const content = body.choices?.[0]?.message?.content
      if (!content) {
        options.onError?.(provider.name, 'empty response')
        continue
      }
      const parsed = parseContent(content)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        options.onError?.(provider.name, 'non-object JSON')
        continue
      }
      return parsed
    } catch (error) {
      options.onError?.(provider.name, error instanceof Error ? error.message : String(error))
    }
  }
  return null
}
