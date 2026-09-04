-- P1: auth_papel sem fallback + checagens null-safe nas funções
-- Continua 20260904180000_postgres_best_practices_hardening

-- P1: auth_papel sem default 'recepcao'
-- ---------------------------------------------------------------------------

create or replace function public.auth_papel()
returns public.colaborador_papel
language sql
stable
security invoker
set search_path = public
as $$
  select papel
  from public.profiles
  where id = (select auth.uid());
$$;

revoke execute on function public.auth_papel() from public, anon;
grant execute on function public.auth_papel() to authenticated;

-- Checagens null-safe nas funções que usavam <> / not in
create or replace function public.prevent_self_papel_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if old.papel is distinct from new.papel
    and public.auth_papel() is distinct from 'gerente' then
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
set search_path = public
as $$
begin
  if public.auth_papel() is distinct from 'gerente' then
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

create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security definer
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

create or replace function public.gerar_orcamento_public_token(p_ordem_id uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_papel public.colaborador_papel := public.auth_papel();
  v_token uuid;
  v_status text;
begin
  if v_papel is null or v_papel not in ('recepcao', 'gerente') then
    raise exception 'Sem permissão para gerar link público';
  end if;

  select orcamento_public_token, orcamento_status into v_token, v_status
  from public.ordens_servico where id = p_ordem_id;

  if not found then raise exception 'Ordem de serviço não encontrada'; end if;

  if v_status not in ('aguardando_aprovacao', 'aprovado') then
    raise exception 'Orçamento ainda não está disponível para compartilhamento';
  end if;

  if v_token is not null then return v_token; end if;

  v_token := gen_random_uuid();
  update public.ordens_servico set orcamento_public_token = v_token where id = p_ordem_id;
  return v_token;
end;
$$;

create or replace function public.financeiro_resumo(p_mes date)
returns json
language plpgsql
stable
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_start_date date;
  v_end_date date;
  v_entradas numeric;
  v_saidas numeric;
begin
  if public.auth_papel() is distinct from 'gerente' then
    raise exception 'Apenas gerentes podem acessar o financeiro';
  end if;

  v_start := date_trunc('month', p_mes)::timestamptz;
  v_end := (date_trunc('month', p_mes) + interval '1 month')::timestamptz;
  v_start_date := v_start::date;
  v_end_date := v_end::date;

  select coalesce(sum(o.valor_total), 0)
  into v_entradas
  from public.ordens_servico o
  where o.pago
    and o.valor_total is not null
    and o.pago_em >= v_start
    and o.pago_em < v_end;

  select coalesce(sum(c.valor), 0)
  into v_saidas
  from public.financeiro_contas c
  where c.status = 'pago'
    and c.pago_em >= v_start
    and c.pago_em < v_end;

  return json_build_object(
    'total_faturado', coalesce((
      select sum(o.valor_total)
      from public.ordens_servico o
      where o.status = 'concluida'
        and o.valor_total is not null
        and o.concluida_em >= v_start
        and o.concluida_em < v_end
    ), 0),
    'total_pago', coalesce((
      select sum(o.valor_total)
      from public.ordens_servico o
      where o.status = 'concluida'
        and o.valor_total is not null
        and o.concluida_em >= v_start
        and o.concluida_em < v_end
        and o.pago
    ), 0),
    'total_pendente', coalesce((
      select sum(o.valor_total)
      from public.ordens_servico o
      where o.status = 'concluida'
        and o.valor_total is not null
        and o.concluida_em >= v_start
        and o.concluida_em < v_end
        and not o.pago
    ), 0),
    'qtd_os', coalesce((
      select count(*)::int
      from public.ordens_servico o
      where o.status = 'concluida'
        and o.valor_total is not null
        and o.concluida_em >= v_start
        and o.concluida_em < v_end
    ), 0),
    'total_a_pagar', coalesce((
      select sum(c.valor)
      from public.financeiro_contas c
      where c.status = 'a_pagar'
        and c.vencimento >= v_start_date
        and c.vencimento < v_end_date
    ), 0),
    'total_pago_despesas', coalesce((
      select sum(c.valor)
      from public.financeiro_contas c
      where c.status = 'pago'
        and c.pago_em >= v_start
        and c.pago_em < v_end
    ), 0),
    'total_vencido', coalesce((
      select sum(c.valor)
      from public.financeiro_contas c
      where c.status = 'a_pagar'
        and c.vencimento < current_date
    ), 0),
    'entradas', v_entradas,
    'saidas', v_saidas,
    'saldo', v_entradas - v_saidas
  );
end;
$$;

create or replace function public.equipe_indicadores(p_inicio date, p_fim date)
returns json
language plpgsql
stable
set search_path = public
as $$
declare
  v_os_total bigint;
  v_presenca_ok bigint;
  v_presenca_total bigint;
  v_faltas bigint;
  v_taxa numeric;
begin
  if public.auth_papel() is distinct from 'gerente' then
    raise exception 'Apenas gerentes podem ver indicadores da equipe';
  end if;

  if p_fim < p_inicio then
    raise exception 'Período inválido';
  end if;

  select count(*)
  into v_os_total
  from public.ordens_servico o
  where o.status = 'concluida'
    and o.concluida_em is not null
    and (o.concluida_em at time zone 'America/Sao_Paulo')::date >= p_inicio
    and (o.concluida_em at time zone 'America/Sao_Paulo')::date <= p_fim;

  select
    count(*) filter (where p.status in ('presente', 'atrasado')),
    count(*) filter (where p.status in ('presente', 'atrasado', 'ausente'))
  into v_presenca_ok, v_presenca_total
  from public.colaborador_presencas p
  where p.data >= p_inicio
    and p.data <= p_fim;

  select count(*)
  into v_faltas
  from public.colaborador_faltas f
  where f.data >= p_inicio
    and f.data <= p_fim;

  v_taxa := case
    when v_presenca_total > 0 then round((v_presenca_ok::numeric / v_presenca_total::numeric) * 100, 1)
    else null
  end;

  return json_build_object(
    'os_concluidas', v_os_total,
    'taxa_presenca', v_taxa,
    'faltas', v_faltas,
    'por_colaborador', coalesce((
      select json_agg(row_to_json(t) order by t.nome)
      from (
        select
          pr.id,
          pr.nome,
          (
            select count(*)
            from public.ordens_servico o
            where o.status = 'concluida'
              and o.aberto_por = pr.id
              and o.concluida_em is not null
              and (o.concluida_em at time zone 'America/Sao_Paulo')::date >= p_inicio
              and (o.concluida_em at time zone 'America/Sao_Paulo')::date <= p_fim
          )::bigint as os_concluidas,
          (
            select case
              when count(*) filter (where p.status in ('presente', 'atrasado', 'ausente')) = 0 then null
              else round(
                (
                  count(*) filter (where p.status in ('presente', 'atrasado'))::numeric
                  / nullif(count(*) filter (where p.status in ('presente', 'atrasado', 'ausente')), 0)::numeric
                ) * 100,
                1
              )
            end
            from public.colaborador_presencas p
            where p.colaborador_id = pr.id
              and p.data >= p_inicio
              and p.data <= p_fim
          ) as presenca_pct,
          (
            select count(*)
            from public.colaborador_faltas f
            where f.colaborador_id = pr.id
              and f.data >= p_inicio
              and f.data <= p_fim
          )::bigint as faltas
        from public.profiles pr
        order by pr.nome
      ) t
    ), '[]'::json)
  );
end;
$$;

create or replace function public.validate_ordem_servico_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  p public.colaborador_papel := public.auth_papel();
begin
  if old.status = 'concluida' and new.status is distinct from old.status then
    raise exception 'OS concluída não pode mudar de status';
  end if;

  if old.status = 'concluida' then
    if (new.reclamacao, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.aberto_por, new.aberta_em,
        new.orcamento_public_token, new.concluida_em)
       is distinct from
       (old.reclamacao, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.aberto_por, old.aberta_em,
        old.orcamento_public_token, old.concluida_em) then
      raise exception 'OS concluída é somente leitura';
    end if;
  end if;

  if new.status = 'concluida' and old.status is distinct from 'concluida' then
    if new.orcamento_status is distinct from 'aprovado' then
      raise exception 'Aprove o orçamento antes de concluir a OS';
    end if;
  end if;

  if p is null then
    raise exception 'Sem permissão para alterar a ordem';
  end if;

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
      if not (
        (old.status = 'em_andamento' and new.status = 'concluida')
        or (old.status = 'retrabalho' and new.status = 'concluida')
      ) then
        raise exception 'Mecânico só pode concluir ordens em andamento ou em retrabalho';
      end if;
    end if;

    return new;
  end if;

  raise exception 'Sem permissão para alterar a ordem';
end;
$$;

-- ---------------------------------------------------------------------------
