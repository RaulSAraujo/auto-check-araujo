-- Fix financeiro_resumo: json || json is invalid in Postgres (|| works on jsonb).
-- Compute saldo in the same json_build_object to avoid concatenation.

create or replace function public.financeiro_resumo(p_mes date)
returns json
language plpgsql
stable
security invoker
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
  if public.auth_papel() <> 'gerente' then
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

revoke execute on function public.financeiro_resumo(date) from public, anon;
grant execute on function public.financeiro_resumo(date) to authenticated;
