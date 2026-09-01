-- Security & performance hardening (advisors + best practices)

-- 1. Fix search_path on trigger functions
create or replace function public.normalize_placa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.placa := upper(regexp_replace(new.placa, '[^A-Za-z0-9]', '', 'g'));
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.gerar_numero_os()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  seq bigint;
  ano text;
begin
  if new.numero is null or new.numero = '' then
    seq := nextval('public.ordens_servico_numero_seq');
    ano := to_char(timezone('America/Sao_Paulo', now()), 'YYYY');
    new.numero := 'OS-' || ano || '-' || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;

-- 2. Restrict SECURITY DEFINER functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. criar_checklist_da_os: SECURITY INVOKER (RLS já permite authenticated)
create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_checklist_id uuid;
  v_template_id uuid;
  v_existing uuid;
begin
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

  if v_template_id is null then
    raise exception 'Nenhum template de checklist ativo';
  end if;

  insert into public.checklists (ordem_servico_id, status)
  values (p_ordem_servico_id, 'em_preenchimento')
  returning id into v_checklist_id;

  insert into public.checklist_itens (checklist_id, categoria, label, ordem)
  select v_checklist_id, categoria, label, ordem
  from public.checklist_template_itens
  where template_id = v_template_id
  order by ordem;

  update public.ordens_servico
  set status = case when status = 'aberta' then 'em_andamento' else status end
  where id = p_ordem_servico_id;

  return v_checklist_id;
end;
$$;

revoke execute on function public.criar_checklist_da_os(uuid) from public, anon;
grant execute on function public.criar_checklist_da_os(uuid) to authenticated;

-- 4. Optimize profiles RLS (initplan pattern)
drop policy if exists "Colaboradores leem o próprio perfil" on public.profiles;
drop policy if exists "Colaboradores atualizam o próprio perfil" on public.profiles;
drop policy if exists "Colaboradores inserem o próprio perfil" on public.profiles;

create policy "Colaboradores leem o próprio perfil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Colaboradores atualizam o próprio perfil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Colaboradores inserem o próprio perfil"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- 5. Missing FK index
create index if not exists ordens_servico_aberto_por_idx
  on public.ordens_servico (aberto_por);

-- 6. Dashboard stats (single round-trip)
create or replace function public.dashboard_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'clientes', (select count(*)::int from public.clientes),
    'veiculos', (select count(*)::int from public.veiculos),
    'os_abertas', (select count(*)::int from public.ordens_servico where status = 'aberta'),
    'os_andamento', (select count(*)::int from public.ordens_servico where status = 'em_andamento')
  );
$$;

revoke execute on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
