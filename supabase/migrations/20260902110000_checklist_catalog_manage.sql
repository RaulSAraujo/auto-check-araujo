-- Catálogo de checklist: gerenciamento por gerente e importação na OS.

alter table public.checklist_template_itens
  add column if not exists ativo boolean not null default true;

create index if not exists checklist_template_itens_ativo_idx
  on public.checklist_template_itens (template_id, ativo, ordem);

-- RLS: gerente gerencia templates
create policy "Gerente cria templates"
  on public.checklist_templates for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza templates"
  on public.checklist_templates for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente cria template itens"
  on public.checklist_template_itens for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza template itens"
  on public.checklist_template_itens for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

-- Ao iniciar checklist, copia itens ativos do catálogo (se houver)
create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checklist_id uuid;
  v_template_id uuid;
  v_existing uuid;
begin
  if public.auth_papel() not in ('recepcao', 'gerente') then
    raise exception 'Sem permissão para iniciar checklist';
  end if;

  select id into v_existing
  from public.checklists
  where ordem_servico_id = p_ordem_servico_id;

  if v_existing is not null then
    return v_existing;
  end if;

  select id into v_template_id
  from public.checklist_templates
  where ativo = true
  order by created_at asc
  limit 1;

  insert into public.checklists (ordem_servico_id, status)
  values (p_ordem_servico_id, 'em_preenchimento')
  returning id into v_checklist_id;

  if v_template_id is not null then
    insert into public.checklist_itens (checklist_id, categoria, label, ordem)
    select v_checklist_id, categoria, label, ordem
    from public.checklist_template_itens
    where template_id = v_template_id
      and ativo = true
    order by ordem;
  end if;

  update public.ordens_servico
  set status = case when status = 'aberta' then 'em_andamento' else status end
  where id = p_ordem_servico_id;

  return v_checklist_id;
end;
$$;

-- Importa itens do catálogo para um checklist existente (ignora duplicatas)
create or replace function public.importar_checklist_do_catalogo(p_checklist_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
  v_imported integer;
begin
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

grant execute on function public.importar_checklist_do_catalogo(uuid) to authenticated;
