-- Home dashboard: 1 round-trip + indexes for status/date filters
-- (query-composite-indexes, query-partial-indexes, data-n-plus-one)

create index if not exists ordens_servico_active_aberta_em_idx
  on public.ordens_servico (aberta_em desc)
  where status in ('aberta', 'em_andamento', 'retrabalho');

create index if not exists ordens_servico_concluida_em_idx
  on public.ordens_servico (concluida_em)
  where status = 'concluida' and concluida_em is not null;

create index if not exists agendamentos_inicio_status_idx
  on public.agendamentos (inicio, status);

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
    'em_andamento', coalesce(count(*) filter (where o.status = 'em_andamento'), 0)::int,
    'retrabalho', coalesce(count(*) filter (where o.status = 'retrabalho'), 0)::int
  )
  into v_status_counts
  from public.ordens_servico o
  where o.status in ('aberta', 'em_andamento', 'retrabalho');

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
    where o.status in ('aberta', 'em_andamento', 'retrabalho')
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
    v_finance := public.financeiro_resumo(v_month_start);
  end if;

  return json_build_object(
    'clientes', (select count(*)::int from public.clientes),
    'veiculos', (select count(*)::int from public.veiculos),
    'status_counts', coalesce(v_status_counts, '{"aberta":0,"em_andamento":0,"retrabalho":0}'::json),
    'active_orders', coalesce(v_active_orders, '[]'::json),
    'weekly_trend', coalesce(v_weekly_trend, '[]'::json),
    'today_appointments', coalesce(v_appointments, '[]'::json),
    'finance', v_finance,
    'local_date', v_local_date
  );
end;
$$;

revoke execute on function public.dashboard_home(timestamptz) from public, anon;
grant execute on function public.dashboard_home(timestamptz) to authenticated;

-- Keep dashboard_stats aligned (same active-status semantics) for any legacy callers
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
    'os_abertas', (
      select count(*)::int from public.ordens_servico where status = 'aberta'
    ),
    'os_andamento', (
      select count(*)::int
      from public.ordens_servico
      where status in ('em_andamento', 'retrabalho')
    )
  );
$$;
