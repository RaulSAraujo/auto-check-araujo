-- Permite alterar papel via SQL Editor / service role (sem contexto JWT)
-- e via RPC dedicada para gerentes no app

create or replace function public.prevent_self_papel_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- SQL Editor, migrations e service role não têm auth.uid()
  if (select auth.uid()) is null then
    return new;
  end if;

  if old.papel is distinct from new.papel
    and public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem alterar papéis de colaboradores';
  end if;

  return new;
end;
$$;

create or replace function public.update_colaborador_papel(
  p_user_id uuid,
  p_papel public.colaborador_papel
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem alterar papéis de colaboradores';
  end if;

  update public.profiles
  set papel = p_papel
  where id = p_user_id;

  if not found then
    raise exception 'Colaborador não encontrado';
  end if;
end;
$$;

revoke execute on function public.update_colaborador_papel(uuid, public.colaborador_papel) from public, anon;
grant execute on function public.update_colaborador_papel(uuid, public.colaborador_papel) to authenticated;
