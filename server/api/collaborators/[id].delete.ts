import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { getSupabaseAdminConfig, supabaseAdminFetch } from '../../utils/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Colaborador inválido' })
  }

  if (id === user.sub) {
    throw createError({ statusCode: 400, message: 'Você não pode excluir o próprio usuário' })
  }

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('papel')
    .eq('id', user.sub)
    .single()

  if (profileError || profile?.papel !== 'gerente') {
    throw createError({ statusCode: 403, message: 'Apenas gerentes podem excluir colaboradores' })
  }

  const { data: target, error: targetError } = await client
    .from('profiles')
    .select('username')
    .eq('id', id)
    .maybeSingle()

  if (targetError || !target) {
    throw createError({ statusCode: 404, message: 'Colaborador não encontrado' })
  }

  const { serviceRoleKey, supabaseUrl } = getSupabaseAdminConfig(event)
  await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/auth/v1/admin/users/${id}`, {
    method: 'DELETE'
  })

  return { ok: true, username: target.username }
})
