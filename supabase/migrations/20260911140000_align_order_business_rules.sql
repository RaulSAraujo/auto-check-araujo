-- Align OS/orçamento rules with internal-only workshop flow:
-- - drop status retrabalho (migrate → em_andamento)
-- - em_andamento requires orçamento aprovado
-- - concluída requires aprovado + pago (valor_total 0 dispensa pago)
-- - recepção pode registrar pagamento (oficina pequena)
-- - revoke public budget RPCs (PDF-only sharing)

-- ---------------------------------------------------------------------------
-- Data + check constraint
-- ---------------------------------------------------------------------------
update public.ordens_servico
set status = 'em_andamento'
where status = 'retrabalho';

alter table public.ordens_servico
  drop constraint if exists ordens_servico_status_check;

alter table public.ordens_servico
  add constraint ordens_servico_status_check
  check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada'));

-- ---------------------------------------------------------------------------
-- Trigger: validate_ordem_servico_update
-- ---------------------------------------------------------------------------
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

  if new.status = 'em_andamento'
     and old.status is distinct from 'em_andamento'
     and new.orcamento_status is distinct from 'aprovado' then
    raise exception 'Aprove o orçamento antes de iniciar o serviço';
  end if;

  if new.status = 'concluida' and old.status is distinct from 'concluida' then
    if new.orcamento_status is distinct from 'aprovado' then
      raise exception 'Aprove o orçamento antes de concluir a OS';
    end if;
    if coalesce(new.valor_total, 0) > 0 and coalesce(new.pago, false) is not true then
      raise exception 'Registre o pagamento antes de concluir a OS';
    end if;
  end if;

  if p is null then
    raise exception 'Sem permissão para alterar a ordem';
  end if;

  if p in ('recepcao', 'gerente') then
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

  raise exception 'Sem permissão para alterar a ordem';
end;
$$;

-- ---------------------------------------------------------------------------
-- Agendamento sync (sem retrabalho)
-- ---------------------------------------------------------------------------
create or replace function public.sync_agendamento_status_from_os()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_status text;
begin
  next_status := case
    when new.status = 'concluida' then 'concluido'
    when new.status = 'cancelada' then 'cancelado'
    when new.status in ('aberta', 'em_andamento') then 'em_atendimento'
    else null
  end;

  if next_status is null then
    return new;
  end if;

  update public.agendamentos
  set status = next_status
  where ordem_servico_id = new.id
    and status not in ('nao_compareceu', 'tratado');

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard home (sem retrabalho)
-- ---------------------------------------------------------------------------
create or replace function public.dashboard_home(p_now timestamptz default now())
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_tz constant text := 'America/Sao_Paulo';
  v_local_date date := (p_now at time zone v_tz)::date;
  v_today_start timestamptz := (v_local_date::timestamp at time zone v_tz);
  v_today_end timestamptz := ((v_local_date + 1)::timestamp at time zone v_tz);
  v_week_start timestamptz := ((v_local_date - 6)::timestamp at time zone v_tz);
  v_month_start date := date_trunc('month', v_local_date)::date;
  v_status_counts json;
  v_active_orders json;
  v_weekly_trend json;
  v_appointments json;
  v_finance json;
begin
  select json_build_object(
    'aberta', coalesce(count(*) filter (where o.status = 'aberta'), 0)::int,
    'em_andamento', coalesce(count(*) filter (where o.status = 'em_andamento'), 0)::int
  )
  into v_status_counts
  from public.ordens_servico o
  where o.status in ('aberta', 'em_andamento');

  select coalesce(json_agg(row_data), '[]'::json)
  into v_active_orders
  from (
    select json_build_object(
      'id', o.id,
      'numero', o.numero,
      'status', o.status,
      'aberta_em', o.aberta_em,
      'veiculos', case
        when v.id is null then null
        else json_build_object(
          'placa', v.placa,
          'marca', v.marca,
          'modelo', v.modelo,
          'clientes', case
            when c.id is null then null
            else json_build_object('id', c.id, 'nome', c.nome)
          end
        )
      end
    ) as row_data
    from public.ordens_servico o
    left join public.veiculos v on v.id = o.veiculo_id
    left join public.clientes c on c.id = v.cliente_id
    where o.status in ('aberta', 'em_andamento')
    order by o.aberta_em desc
    limit 12
  ) ranked;

  select coalesce(json_agg(day_row order by day_row.day), '[]'::json)
  into v_weekly_trend
  from (
    select
      ((o.concluida_em at time zone v_tz)::date) as day,
      count(*)::int as count,
      coalesce(sum(o.valor_total), 0)::numeric as valor
    from public.ordens_servico o
    where o.status = 'concluida'
      and o.concluida_em is not null
      and o.concluida_em >= v_week_start
      and o.concluida_em < v_today_end
    group by 1
  ) day_row;

  select coalesce(json_agg(row_data), '[]'::json)
  into v_appointments
  from (
    select json_build_object(
      'id', a.id,
      'inicio', a.inicio,
      'fim', a.fim,
      'status', a.status,
      'servico', a.servico,
      'patio_vaga', a.patio_vaga,
      'clientes', case
        when c.id is null then null
        else json_build_object('id', c.id, 'nome', c.nome)
      end,
      'veiculos', case
        when v.id is null then null
        else json_build_object(
          'id', v.id,
          'placa', v.placa,
          'marca', v.marca,
          'modelo', v.modelo
        )
      end
    ) as row_data
    from public.agendamentos a
    left join public.clientes c on c.id = a.cliente_id
    left join public.veiculos v on v.id = a.veiculo_id
    where a.inicio >= v_today_start
      and a.inicio < v_today_end
      and a.status in ('agendado', 'confirmado', 'em_atendimento')
    order by a.inicio asc
    limit 10
  ) ranked;

  v_finance := null;
  if public.auth_papel() = 'gerente' then
    v_finance := public.finance_summary(v_month_start);
  end if;

  return json_build_object(
    'clientes', (select count(*)::int from public.clientes),
    'veiculos', (select count(*)::int from public.veiculos),
    'status_counts', coalesce(v_status_counts, '{"aberta":0,"em_andamento":0}'::json),
    'active_orders', coalesce(v_active_orders, '[]'::json),
    'weekly_trend', coalesce(v_weekly_trend, '[]'::json),
    'today_appointments', coalesce(v_appointments, '[]'::json),
    'finance', v_finance,
    'local_date', v_local_date
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Kill public budget surface
-- ---------------------------------------------------------------------------
revoke all on function public.get_public_budget(uuid) from public, anon, authenticated;
revoke all on function private.get_public_budget(uuid) from public, anon, authenticated;
revoke all on function public.generate_budget_public_token(uuid) from public, anon, authenticated;

drop function if exists public.get_public_budget(uuid);
drop function if exists private.get_public_budget(uuid);
drop function if exists public.generate_budget_public_token(uuid);
