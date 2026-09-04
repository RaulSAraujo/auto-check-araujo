-- Clear Security Advisor WARN: SECURITY DEFINER executable by anon/authenticated
-- 1) App RPCs that already enforce auth_papel → SECURITY INVOKER
-- 2) get_orcamento_publico DEFINER moved to private (not exposed by Data API)

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- list_colaboradores → INVOKER (RLS profiles SELECT already allows authenticated)
-- ---------------------------------------------------------------------------

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
security invoker
set search_path = public
as $$
  select
    p.id,
    p.nome,
    p.papel,
    p.username,
    p.created_at
  from public.profiles p
  where (select public.auth_papel()) = 'gerente'
  order by p.created_at asc;
$$;

revoke execute on function public.list_colaboradores() from public, anon;
grant execute on function public.list_colaboradores() to authenticated;

-- ---------------------------------------------------------------------------
-- criar_checklist_da_os → INVOKER (RLS already covers inserts/updates)
-- ---------------------------------------------------------------------------

create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_papel public.colaborador_papel := public.auth_papel();
  v_checklist_id uuid;
  v_template_id uuid;
  v_existing uuid;
begin
  if v_papel is null or v_papel not in ('recepcao', 'gerente') then
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

revoke execute on function public.criar_checklist_da_os(uuid) from public, anon;
grant execute on function public.criar_checklist_da_os(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- importar_checklist_do_catalogo → INVOKER
-- ---------------------------------------------------------------------------

create or replace function public.importar_checklist_do_catalogo(p_checklist_id uuid)
returns integer
language plpgsql
security invoker
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
-- get_orcamento_publico: DEFINER in private + thin INVOKER wrapper in public
-- ---------------------------------------------------------------------------

create or replace function private.get_orcamento_publico(p_token uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  if p_token is null then
    raise exception 'Token inválido';
  end if;

  select json_build_object(
    'numero', o.numero,
    'orcamento_status', o.orcamento_status,
    'aberta_em', o.aberta_em,
    'reclamacao', o.reclamacao,
    'km_entrada', o.km_entrada,
    'veiculo', json_build_object('placa', v.placa, 'marca', v.marca, 'modelo', v.modelo),
    'cliente', json_build_object('nome', c.nome),
    'itens', coalesce((
      select json_agg(json_build_object(
        'id', i.id, 'tipo', i.tipo, 'descricao', i.descricao,
        'quantidade', i.quantidade, 'valor_unitario', i.valor_unitario, 'ordem', i.ordem
      ) order by i.ordem)
      from public.ordem_itens i where i.ordem_servico_id = o.id
    ), '[]'::json),
    'valor_total', coalesce(o.valor_total, (
      select sum(i.quantidade * i.valor_unitario)
      from public.ordem_itens i
      where i.ordem_servico_id = o.id
    ), 0)
  ) into v_result
  from public.ordens_servico o
  join public.veiculos v on v.id = o.veiculo_id
  join public.clientes c on c.id = v.cliente_id
  where o.orcamento_public_token = p_token
    and o.orcamento_status in ('aguardando_aprovacao', 'aprovado');

  if v_result is null then
    raise exception 'Orçamento não encontrado ou indisponível';
  end if;

  return v_result;
end;
$$;

revoke all on function private.get_orcamento_publico(uuid) from public;
grant execute on function private.get_orcamento_publico(uuid) to anon, authenticated, service_role;

create or replace function public.get_orcamento_publico(p_token uuid)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select private.get_orcamento_publico(p_token);
$$;

revoke execute on function public.get_orcamento_publico(uuid) from public;
grant execute on function public.get_orcamento_publico(uuid) to anon, authenticated;
