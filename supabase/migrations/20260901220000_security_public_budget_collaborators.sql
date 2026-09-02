-- RLS endurecida, link público de orçamento e gestão de colaboradores

-- ---------------------------------------------------------------------------
-- Perfis: impedir auto-promoção de papel
-- ---------------------------------------------------------------------------

create or replace function public.prevent_self_papel_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.papel is distinct from new.papel
    and public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem alterar papéis de colaboradores';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_papel_change on public.profiles;

create trigger profiles_prevent_self_papel_change
  before update on public.profiles
  for each row execute function public.prevent_self_papel_change();

drop policy if exists "Colaboradores atualizam o próprio perfil" on public.profiles;

create policy "Colaboradores atualizam próprio perfil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Gerente atualiza colaboradores"
  on public.profiles for update
  to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

-- Papel inicial via convite (app_metadata definido pelo service role)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(
      (new.raw_app_meta_data ->> 'papel')::public.colaborador_papel,
      'recepcao'::public.colaborador_papel
    )
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Link público de orçamento (coluna antes dos triggers que a referenciam)
-- ---------------------------------------------------------------------------

alter table public.ordens_servico
  add column if not exists orcamento_public_token uuid unique;

create index if not exists ordens_servico_public_token_idx
  on public.ordens_servico (orcamento_public_token)
  where orcamento_public_token is not null;

-- ---------------------------------------------------------------------------
-- Ordens de serviço: políticas por papel + validação de campos
-- ---------------------------------------------------------------------------

create or replace function public.validate_ordem_servico_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  p public.colaborador_papel := public.auth_papel();
begin
  if p in ('recepcao', 'gerente') then
    if p <> 'gerente' then
      if new.pago is distinct from old.pago
        or new.forma_pagamento is distinct from old.forma_pagamento
        or new.pago_em is distinct from old.pago_em then
        raise exception 'Apenas gerentes podem registrar pagamento';
      end if;
    end if;

    return new;
  end if;

  if p = 'mecanico' then
    if (new.reclamacao, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.pago, new.forma_pagamento, new.pago_em,
        new.aberto_por, new.aberta_em, new.orcamento_public_token)
       is distinct from
       (old.reclamacao, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.pago, old.forma_pagamento, old.pago_em,
        old.aberto_por, old.aberta_em, old.orcamento_public_token) then
      raise exception 'Mecânico não pode alterar dados da ordem';
    end if;

    if old.status is distinct from new.status then
      if not (old.status = 'em_andamento' and new.status = 'concluida') then
        raise exception 'Mecânico só pode concluir ordens em andamento';
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists ordens_servico_validate_update on public.ordens_servico;

create trigger ordens_servico_validate_update
  before update on public.ordens_servico
  for each row execute function public.validate_ordem_servico_update();

drop policy if exists "Colaboradores criam ordens" on public.ordens_servico;
drop policy if exists "Colaboradores atualizam ordens" on public.ordens_servico;
drop policy if exists "Colaboradores excluem ordens" on public.ordens_servico;

create policy "Recepção e gerente criam ordens"
  on public.ordens_servico for insert
  to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam ordens"
  on public.ordens_servico for update
  to authenticated
  using (true)
  with check (true);

create policy "Gerente exclui ordens"
  on public.ordens_servico for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

-- ---------------------------------------------------------------------------
-- Checklists: iniciar apenas recepção/gerente
-- ---------------------------------------------------------------------------

drop policy if exists "Colaboradores criam checklists" on public.checklists;
drop policy if exists "Colaboradores excluem checklists" on public.checklists;

create policy "Recepção e gerente criam checklists"
  on public.checklists for insert
  to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Gerente exclui checklists"
  on public.checklists for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

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

-- ---------------------------------------------------------------------------
-- Fotos de checklist: escrita restrita a recepção/gerente
-- ---------------------------------------------------------------------------

drop policy if exists "Colaboradores criam fotos de checklist" on public.checklist_item_fotos;
drop policy if exists "Colaboradores excluem fotos de checklist" on public.checklist_item_fotos;

create policy "Colaboradores criam fotos de checklist"
  on public.checklist_item_fotos for insert
  to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente', 'mecanico'));

create policy "Colaboradores excluem fotos de checklist"
  on public.checklist_item_fotos for delete
  to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente', 'mecanico'));

drop policy if exists "Colaboradores enviam fotos de checklist" on storage.objects;
drop policy if exists "Colaboradores removem fotos de checklist" on storage.objects;
drop policy if exists "Recepção e gerente enviam fotos de checklist" on storage.objects;
drop policy if exists "Recepção e gerente removem fotos de checklist" on storage.objects;

create policy "Colaboradores enviam fotos de checklist"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checklist-fotos'
    and public.auth_papel() in ('recepcao', 'gerente', 'mecanico')
  );

create policy "Colaboradores removem fotos de checklist"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'checklist-fotos'
    and public.auth_papel() in ('recepcao', 'gerente', 'mecanico')
  );

-- ---------------------------------------------------------------------------
-- Financeiro: apenas gerente
-- ---------------------------------------------------------------------------

create or replace function public.financeiro_resumo(p_mes date)
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem acessar o financeiro';
  end if;

  return (
    with bounds as (
      select
        date_trunc('month', p_mes)::timestamptz as start_at,
        (date_trunc('month', p_mes) + interval '1 month')::timestamptz as end_at
    )
    select json_build_object(
      'total_faturado', coalesce(sum(o.valor_total), 0),
      'total_pago', coalesce(sum(o.valor_total) filter (where o.pago), 0),
      'total_pendente', coalesce(sum(o.valor_total) filter (where not o.pago), 0),
      'qtd_os', count(*)::int
    )
    from public.ordens_servico o
    cross join bounds b
    where o.status = 'concluida'
      and o.valor_total is not null
      and o.concluida_em >= b.start_at
      and o.concluida_em < b.end_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Funções de orçamento público e colaboradores
-- ---------------------------------------------------------------------------
create or replace function public.gerar_orcamento_public_token(p_ordem_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_token uuid;
  v_status text;
begin
  if public.auth_papel() not in ('recepcao', 'gerente') then
    raise exception 'Sem permissão para gerar link público';
  end if;

  select orcamento_public_token, orcamento_status
  into v_token, v_status
  from public.ordens_servico
  where id = p_ordem_id;

  if not found then
    raise exception 'Ordem de serviço não encontrada';
  end if;

  if v_status not in ('aguardando_aprovacao', 'aprovado') then
    raise exception 'Orçamento ainda não está disponível para compartilhamento';
  end if;

  if v_token is not null then
    return v_token;
  end if;

  v_token := gen_random_uuid();

  update public.ordens_servico
  set orcamento_public_token = v_token
  where id = p_ordem_id;

  return v_token;
end;
$$;

revoke execute on function public.gerar_orcamento_public_token(uuid) from public, anon;
grant execute on function public.gerar_orcamento_public_token(uuid) to authenticated;

create or replace function public.get_orcamento_publico(p_token uuid)
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
    'veiculo', json_build_object(
      'placa', v.placa,
      'marca', v.marca,
      'modelo', v.modelo
    ),
    'cliente', json_build_object(
      'nome', c.nome
    ),
    'itens', coalesce((
      select json_agg(
        json_build_object(
          'id', i.id,
          'tipo', i.tipo,
          'descricao', i.descricao,
          'quantidade', i.quantidade,
          'valor_unitario', i.valor_unitario,
          'ordem', i.ordem
        )
        order by i.ordem
      )
      from public.ordem_itens i
      where i.ordem_servico_id = o.id
    ), '[]'::json),
    'valor_total', coalesce(
      o.valor_total,
      (
        select sum(i.quantidade * i.valor_unitario)
        from public.ordem_itens i
        where i.ordem_servico_id = o.id
      ),
      0
    )
  )
  into v_result
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

revoke execute on function public.get_orcamento_publico(uuid) from public;
grant execute on function public.get_orcamento_publico(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Listagem de colaboradores (gerente)
-- ---------------------------------------------------------------------------

create or replace function public.list_colaboradores()
returns table (
  id uuid,
  nome text,
  papel public.colaborador_papel,
  email text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.nome,
    p.papel,
    u.email::text,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.auth_papel() = 'gerente'
  order by p.created_at asc;
$$;

revoke execute on function public.list_colaboradores() from public, anon;
grant execute on function public.list_colaboradores() to authenticated;
