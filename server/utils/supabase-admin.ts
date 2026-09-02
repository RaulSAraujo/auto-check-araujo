import type { H3Event } from 'h3'

export async function supabaseAdminFetch(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof payload?.msg === 'string'
      ? payload.msg
      : typeof payload?.message === 'string'
        ? payload.message
        : 'Erro na API do Supabase'
    throw createError({ statusCode: response.status, message })
  }

  return payload
}

export function getSupabaseAdminConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Service role não configurada no servidor'
    })
  }

  const supabaseUrl = config.public.supabase?.url
    || process.env.NUXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL

  if (!supabaseUrl) {
    throw createError({ statusCode: 500, message: 'URL do Supabase não configurada' })
  }

  return { serviceRoleKey, supabaseUrl }
}
