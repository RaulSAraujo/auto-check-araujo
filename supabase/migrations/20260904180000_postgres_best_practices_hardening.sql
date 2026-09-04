-- Hardening alinhado às Supabase Postgres best practices (P0–P2)
-- Manual (fora de SQL): Auth → Password security → leaked password protection

-- ---------------------------------------------------------------------------
-- P0: importar_checklist_do_catalogo
-- ---------------------------------------------------------------------------

create or replace function public.importar_checklist_do_catalogo(p_checklist_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_papel public.colaborador_papel := public.auth_papel();
  v_template_id uuid;
  v_imported integer;
begin
  if v_papel is null
    or v_papel not in ('recepcao', 'gerente', 'mecanico') then
    raise exception 'Sem permissão para importar checklist do catálogo';
  end if;

  if p_checklist_id is null then
    raise exception 'Checklist inválido';
  end if;

  if not exists (
    select 1 from public.checklists where id = p_checklist_id
  ) then
    raise exception 'Checklist não encontrado';
  end if;

  select id into v_template_id
  from public.checklist_templates
  where ativo = true
  order by created_at asc
  limit 1;

  if v_template_id is null then
    return 0;
  end if;

  with catalog as (
    select categoria, label, ordem
    from public.checklist_template_itens
    where template_id = v_template_id
      and ativo = true
  ),
  next_ordem as (
    select coalesce(max(ordem), -1) + 1 as base
    from public.checklist_itens
    where checklist_id = p_checklist_id
  ),
  to_insert as (
    select
      c.categoria,
      c.label,
      (select base from next_ordem) + row_number() over (order by c.ordem) - 1 as ordem
    from catalog c
    where not exists (
      select 1
      from public.checklist_itens i
      where i.checklist_id = p_checklist_id
        and lower(trim(i.categoria)) = lower(trim(c.categoria))
        and lower(trim(i.label)) = lower(trim(c.label))
    )
  )
  insert into public.checklist_itens (checklist_id, categoria, label, ordem)
  select p_checklist_id, categoria, label, ordem
  from to_insert;

  get diagnostics v_imported = row_count;
  return v_imported;
end;
$$;

revoke execute on function public.importar_checklist_do_catalogo(uuid) from public, anon;
grant execute on function public.importar_checklist_do_catalogo(uuid) to authenticated;

-- ---------------------------------------------------------------------------
