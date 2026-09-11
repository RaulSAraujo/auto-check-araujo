-- RPC para extrato financeiro unificado (Entradas + Saídas) com paginação nativa em SQL

create or replace function public.financeiro_extrato(
  p_mes date,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id text,
  tipo text,
  descricao text,
  valor numeric,
  pago_em timestamptz,
  forma_pagamento text,
  meta text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem acessar o financeiro';
  end if;

  v_start := date_trunc('month', p_mes)::timestamptz;
  v_end := (date_trunc('month', p_mes) + interval '1 month')::timestamptz;

  return query
  with movimentacoes as (
    select
      'os-' || o.id::text as id,
      'entrada'::text as tipo,
      'OS ' || o.numero as descricao,
      o.valor_total as valor,
      o.pago_em,
      o.forma_pagamento,
      v.placa as meta
    from public.ordens_servico o
    left join public.veiculos v on v.id = o.veiculo_id
    where o.pago
      and o.valor_total is not null
      and o.pago_em >= v_start
      and o.pago_em < v_end

    union all

    select
      'conta-' || c.id::text as id,
      'saida'::text as tipo,
      c.descricao,
      c.valor,
      c.pago_em,
      c.forma_pagamento,
      cat.nome as meta
    from public.financeiro_contas c
    left join public.financeiro_categorias cat on cat.id = c.categoria_id
    where c.status = 'pago'
      and c.pago_em is not null
      and c.pago_em >= v_start
      and c.pago_em < v_end
  ),
  total_rows as (
    select count(*)::bigint as count_val from movimentacoes
  )
  select
    m.id,
    m.tipo,
    m.descricao,
    m.valor,
    m.pago_em,
    m.forma_pagamento,
    m.meta,
    t.count_val as total_count
  from movimentacoes m
  cross join total_rows t
  order by m.pago_em desc
  limit p_limit
  offset p_offset;
end;
$$;

revoke execute on function public.financeiro_extrato(date, integer, integer) from public, anon;
grant execute on function public.financeiro_extrato(date, integer, integer) to authenticated;
