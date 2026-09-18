import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import {
  isValidCollaboratorPassword,
  isValidUsername,
  normalizeUsername,
  usernameToAuthEmail
} from '~~/shared/utils/username'
import { toTitleCasePt } from '~~/shared/utils/text-case'
import { getSupabaseAdminConfig, supabaseAdminFetch } from '../../utils/supabase-admin'

type CreateBody = {
  username?: string
  password?: string
  nome?: string
  papel?: 'recepcao' | 'mecanico' | 'gerente'
}

function parseCreateBody(body: CreateBody) {
  const username = normalizeUsername(body.username ?? '')
  const password = body.password ?? ''
  const nome = toTitleCasePt(body.nome ?? '')
  const papel = body.papel

  if (!isValidUsername(username)) {
    throw createError({
      statusCode: 400,
      message: 'Usuário inválido. Use 3–32 caracteres: letras, números, _ ou -'
    })
  }

  if (!isValidCollaboratorPassword(password)) {
    throw createError({
      statusCode: 400,
      message: 'Senha deve ter no mínimo 6 caracteres'
    })
  }

  if (!nome) {
    throw createError({ statusCode: 400, message: 'Nome é obrigatório' })
  }

  if (!papel || !['recepcao', 'mecanico', 'gerente'].includes(papel)) {
    throw createError({ statusCode: 400, message: 'Papel inválido' })
  }

  return { username, password, nome, papel }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('papel')
    .eq('id', user.sub)
    .single()

  if (profileError || profile?.papel !== 'gerente') {
    throw createError({ statusCode: 403, message: 'Apenas gerentes podem criar colaboradores' })
  }

  const body = parseCreateBody(await readBody<CreateBody>(event))
  const { serviceRoleKey, supabaseUrl } = getSupabaseAdminConfig(event)

  const { data: existing } = await client
    .from('profiles')
    .select('id')
    .eq('username', body.username)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Este usuário já está em uso' })
  }

  const authEmail = usernameToAuthEmail(body.username)

  const createdUser = await supabaseAdminFetch(
    supabaseUrl,
    serviceRoleKey,
    '/auth/v1/admin/users',
    {
      method: 'POST',
      body: JSON.stringify({
        email: authEmail,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          nome: body.nome,
          username: body.username
        },
        app_metadata: {
          papel: body.papel
        }
      })
    }
  )

  const userId = createdUser?.id as string | undefined

  if (userId) {
    await supabaseAdminFetch(
      supabaseUrl,
      serviceRoleKey,
      '/rest/v1/profiles',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: userId,
          nome: body.nome,
          username: body.username,
          papel: body.papel
        })
      }
    )
  }

  return { ok: true, username: body.username }
})
