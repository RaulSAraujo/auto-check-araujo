-- Singleton de parâmetros de precificação da oficina

create table public.oficina_parametros (
  id smallint primary key default 1 check (id = 1),
  valor_hora numeric(10, 2) not null default 85
    check (valor_hora >= 0),
  custo_fixo_mensal numeric(12, 2) not null default 12500
    check (custo_fixo_mensal >= 0),
  margem_alvo numeric(5, 2) not null default 35
    check (margem_alvo >= 0 and margem_alvo <= 100),
  horas_produtivas_mes numeric(6, 2) not null default 160
    check (horas_produtivas_mes > 0),
  markup_pecas numeric(5, 2) not null default 40
    check (markup_pecas >= 0),
  precificacao_automatica boolean not null default true,
  taxa_cartao_debito numeric(5, 2) not null default 1.5
    check (taxa_cartao_debito >= 0 and taxa_cartao_debito < 100),
  taxa_cartao_credito numeric(5, 2) not null default 3.5
    check (taxa_cartao_credito >= 0 and taxa_cartao_credito < 100),
  comissao_percentual numeric(5, 2) not null default 10
    check (comissao_percentual >= 0 and comissao_percentual <= 100),
  updated_at timestamptz not null default now()
);

insert into public.oficina_parametros (id) values (1)
on conflict (id) do nothing;

alter table public.oficina_parametros enable row level security;

create policy "Colaboradores leem parametros de precificacao"
  on public.oficina_parametros for select to authenticated using (true);

create policy "Gerente atualiza parametros de precificacao"
  on public.oficina_parametros for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

grant select, update on public.oficina_parametros to authenticated;

create or replace function public.touch_oficina_parametros_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger oficina_parametros_updated_at
  before update on public.oficina_parametros
  for each row
  execute function public.touch_oficina_parametros_updated_at();
