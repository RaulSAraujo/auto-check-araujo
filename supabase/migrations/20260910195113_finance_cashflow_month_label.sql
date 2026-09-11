-- Fix mes_label: Postgres `MMM` is `MM` + literal `M` → "09M/26".
-- Use `Mon/YY` (localized short month). App also formats from `mes` as fallback.

create or replace function public.finance_cashflow_6_months(p_mes_final date default current_date)
returns table (
  mes text,
  mes_label text,
  entradas numeric,
  saidas numeric,
  saldo numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_months date[];
  i int;
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem acessar o financeiro';
  end if;

  v_months := array[
    date_trunc('month', p_mes_final - interval '5 months')::date,
    date_trunc('month', p_mes_final - interval '4 months')::date,
    date_trunc('month', p_mes_final - interval '3 months')::date,
    date_trunc('month', p_mes_final - interval '2 months')::date,
    date_trunc('month', p_mes_final - interval '1 month')::date,
    date_trunc('month', p_mes_final)::date
  ];

  for i in 1..6 loop
    return query
    select
      to_char(v_months[i], 'YYYY-MM') as mes,
      to_char(v_months[i], 'Mon/YY') as mes_label,
      coalesce((
        select sum(o.valor_total)
        from public.ordens_servico o
        where o.pago
          and o.valor_total is not null
          and o.pago_em >= v_months[i]::timestamptz
          and o.pago_em < (v_months[i] + interval '1 month')::timestamptz
      ), 0::numeric) as entradas,
      coalesce((
        select sum(c.valor)
        from public.financeiro_contas c
        where c.status = 'pago'
          and c.pago_em >= v_months[i]::timestamptz
          and c.pago_em < (v_months[i] + interval '1 month')::timestamptz
      ), 0::numeric) as saidas,
      coalesce((
        select sum(o.valor_total)
        from public.ordens_servico o
        where o.pago
          and o.valor_total is not null
          and o.pago_em >= v_months[i]::timestamptz
          and o.pago_em < (v_months[i] + interval '1 month')::timestamptz
      ), 0::numeric) - coalesce((
        select sum(c.valor)
        from public.financeiro_contas c
        where c.status = 'pago'
          and c.pago_em >= v_months[i]::timestamptz
          and c.pago_em < (v_months[i] + interval '1 month')::timestamptz
      ), 0::numeric) as saldo;
  end loop;
end;
$$;
