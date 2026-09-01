-- Financeiro simples: pagamento de OS e resumo mensal

alter table public.ordens_servico
  add column valor_total numeric(10, 2) check (valor_total is null or valor_total >= 0),
  add column pago boolean not null default false,
  add column pago_em timestamptz,
  add column forma_pagamento text check (
    forma_pagamento is null
    or forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')
  );

create or replace function public.trg_sync_valor_on_budget_approve()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.orcamento_status = 'aprovado'
    and (tg_op = 'INSERT' or old.orcamento_status is distinct from 'aprovado') then
    new.valor_total := (
      select coalesce(sum(quantidade * valor_unitario), 0)
      from public.ordem_itens
      where ordem_servico_id = new.id
    );
  end if;

  return new;
end;
$$;

create trigger ordens_servico_sync_valor_on_approve
  before insert or update of orcamento_status on public.ordens_servico
  for each row execute function public.trg_sync_valor_on_budget_approve();

create or replace function public.financeiro_resumo(p_mes date)
returns json
language sql
stable
security invoker
set search_path = public
as $$
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
    and o.concluida_em < b.end_at;
$$;

revoke execute on function public.financeiro_resumo(date) from public, anon;
grant execute on function public.financeiro_resumo(date) to authenticated;
