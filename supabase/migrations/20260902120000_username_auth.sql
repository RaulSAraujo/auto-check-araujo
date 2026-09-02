-- Login por username: coluna em profiles, e-mails internos em auth.users

alter table public.profiles
  add column if not exists username text;

-- Backfill a partir do e-mail atual (com sufixo se houver duplicata)
with ranked as (
  select
    p.id,
    lower(split_part(u.email, '@', 1)) as base_username,
    row_number() over (
      partition by lower(split_part(u.email, '@', 1))
      order by p.created_at
    ) as rn
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username is null
)
update public.profiles p
set username = case
  when r.rn = 1 then r.base_username
  else r.base_username || r.rn::text
end
from ranked r
where p.id = r.id;

-- Normaliza e-mails existentes para o domínio interno
update auth.users u
set
  email = p.username || '@interno.auto-check',
  raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('username', p.username)
from public.profiles p
where p.id = u.id
  and u.email not like '%@interno.auto-check';

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_key
  on public.profiles (username);

-- Trigger de novo usuário: persiste username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    lower(split_part(new.email, '@', 1))
  );

  insert into public.profiles (id, nome, papel, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', v_username),
    coalesce(
      (new.raw_app_meta_data ->> 'papel')::public.colaborador_papel,
      'recepcao'::public.colaborador_papel
    ),
    v_username
  );

  return new;
end;
$$;

-- Listagem de colaboradores retorna username
drop function if exists public.list_colaboradores();

create or replace function public.list_colaboradores()
returns table (
  id uuid,
  nome text,
  papel public.colaborador_papel,
  username text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nome,
    p.papel,
    p.username,
    p.created_at
  from public.profiles p
  where public.auth_papel() = 'gerente'
  order by p.created_at asc;
$$;

revoke execute on function public.list_colaboradores() from public, anon;
grant execute on function public.list_colaboradores() to authenticated;
