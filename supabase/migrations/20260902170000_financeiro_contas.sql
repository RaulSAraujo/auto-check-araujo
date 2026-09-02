-- Financeiro completo: categorias, contas a pagar e fluxo mensal

-- ---------------------------------------------------------------------------
-- Categorias de despesa
-- ---------------------------------------------------------------------------

create table public.financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint financeiro_categorias_nome_unique unique (nome)
);

create index financeiro_categorias_ativo_nome_idx
  on public.financeiro_categorias (ativo, nome);

alter table public.financeiro_categorias enable row level security;

create policy "Gerente le categorias financeiras"
  on public.financeiro_categorias for select to authenticated
  using (public.auth_papel() = 'gerente');

create policy "Gerente cria categorias financeiras"
  on public.financeiro_categorias for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza categorias financeiras"
  on public.financeiro_categorias for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente exclui categorias financeiras"
  on public.financeiro_categorias for delete to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.financeiro_categorias to authenticated;

insert into public.financeiro_categorias (nome) values
  ('Aluguel'),
  ('Energia'),
  ('Água'),
  ('Internet'),
  ('Peças'),
  ('Impostos'),
  ('Salários'),
  ('Outros');

-- ---------------------------------------------------------------------------
-- Contas a pagar
-- ---------------------------------------------------------------------------

create table public.financeiro_contas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria_id uuid not null references public.financeiro_categorias (id) on delete restrict,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  valor numeric(10, 2) not null check (valor >= 0),
  vencimento date not null,
  status text not null default 'a_pagar'
    check (status in ('a_pagar', 'pago', 'cancelado')),
  pago_em timestamptz,
  forma_pagamento text
    check (
      forma_pagamento is null
      or forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')
    ),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financeiro_contas_pago_em_check check (
    (status = 'pago' and pago_em is not null)
    or (status <> 'pago')
  )
);

create index financeiro_contas_status_vencimento_idx
  on public.financeiro_contas (status, vencimento);

create index financeiro_contas_pago_em_idx
  on public.financeiro_contas (pago_em)
  where pago_em is not null;

create index financeiro_contas_categoria_id_idx
  on public.financeiro_contas (categoria_id);

create index financeiro_contas_fornecedor_id_idx
  on public.financeiro_contas (fornecedor_id);

alter table public.financeiro_contas enable row level security;

create policy "Gerente le contas financeiras"
  on public.financeiro_contas for select to authenticated
  using (public.auth_papel() = 'gerente');

create policy "Gerente cria contas financeiras"
  on public.financeiro_contas for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza contas financeiras"
  on public.financeiro_contas for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente exclui contas financeiras"
  on public.financeiro_contas for delete to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.financeiro_contas to authenticated;

create or replace function public.trg_financeiro_contas_pago_em()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.status = 'pago' and new.pago_em is null then
    new.pago_em := now();
  end if;

  if new.status is distinct from 'pago' then
    new.pago_em := null;
    if new.status = 'a_pagar' then
      new.forma_pagamento := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger financeiro_contas_pago_em
  before insert or update on public.financeiro_contas
  for each row execute function public.trg_financeiro_contas_pago_em();

-- ---------------------------------------------------------------------------
-- Resumo financeiro estendido (OS + despesas + fluxo de caixa)
-- ---------------------------------------------------------------------------

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
  v_result json;
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem acessar o financeiro';
  end if;

  v_start := date_trunc('month', p_mes)::timestamptz;
  v_end := (date_trunc('month', p_mes) + interval '1 month')::timestamptz;
  v_start_date := v_start::date;
  v_end_date := v_end::date;

  select json_build_object(
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
    'entradas', coalesce((
      select sum(o.valor_total)
      from public.ordens_servico o
      where o.pago
        and o.valor_total is not null
        and o.pago_em >= v_start
        and o.pago_em < v_end
    ), 0),
    'saidas', coalesce((
      select sum(c.valor)
      from public.financeiro_contas c
      where c.status = 'pago'
        and c.pago_em >= v_start
        and c.pago_em < v_end
    ), 0)
  ) into v_result;

  return v_result || json_build_object(
    'saldo',
    coalesce((v_result ->> 'entradas')::numeric, 0)
      - coalesce((v_result ->> 'saidas')::numeric, 0)
  );
end;
$$;

revoke execute on function public.financeiro_resumo(date) from public, anon;
grant execute on function public.financeiro_resumo(date) to authenticated;
