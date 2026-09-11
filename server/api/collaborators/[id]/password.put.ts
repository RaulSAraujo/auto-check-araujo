import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { isValidCollaboratorPassword } from '~~/shared/utils/username'
import { getSupabaseAdminConfig, supabaseAdminFetch } from '../../../utils/supabase-admin'

type PasswordBody = {
  password?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.papel !== 'gerente') {
    throw createError({ statusCode: 403, message: 'Apenas gerentes podem redefinir senha' })
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Colaborador inválido' })
  }

  const { data: target, error: targetError } = await client
    .from('profiles')
    .select('id, username')
    .eq('id', id)
    .maybeSingle()

  if (targetError || !target) {
    throw createError({ statusCode: 404, message: 'Colaborador não encontrado' })
  }

  const body = await readBody<PasswordBody>(event)
  const password = body.password ?? ''

  if (!isValidCollaboratorPassword(password)) {
    throw createError({
      statusCode: 400,
      message: 'Senha deve ter no mínimo 6 caracteres'
    })
  }

  const { serviceRoleKey, supabaseUrl } = getSupabaseAdminConfig(event)

  await supabaseAdminFetch(
    supabaseUrl,
    serviceRoleKey,
    `/auth/v1/admin/users/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ password })
    }
  )

  return { ok: true, username: target.username }
})
