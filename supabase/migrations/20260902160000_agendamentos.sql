-- Agendamentos da oficina: agenda, pátio e não comparecimento

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,
  ordem_servico_id uuid references public.ordens_servico (id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null default 'agendado'
    check (status in (
      'agendado',
      'confirmado',
      'em_atendimento',
      'concluido',
      'nao_compareceu',
      'cancelado'
    )),
  servico text,
  patio_vaga smallint
    check (patio_vaga is null or (patio_vaga >= 1 and patio_vaga <= 8)),
  observacoes text,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agendamentos_periodo_check check (fim > inicio)
);

create index agendamentos_inicio_idx on public.agendamentos (inicio);
create index agendamentos_status_idx on public.agendamentos (status);
create index agendamentos_cliente_id_idx on public.agendamentos (cliente_id);
create index agendamentos_veiculo_id_idx on public.agendamentos (veiculo_id);
create index agendamentos_patio_vaga_idx
  on public.agendamentos (patio_vaga)
  where patio_vaga is not null
    and status not in ('cancelado', 'nao_compareceu', 'concluido');

create trigger agendamentos_set_updated_at
  before update on public.agendamentos
  for each row execute function public.set_updated_at();

alter table public.agendamentos enable row level security;

create policy "Colaboradores leem agendamentos"
  on public.agendamentos for select
  to authenticated
  using (true);

create policy "Recepcao e gerente criam agendamentos"
  on public.agendamentos for insert
  to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Recepcao e gerente atualizam agendamentos"
  on public.agendamentos for update
  to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente'))
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Gerente exclui agendamentos"
  on public.agendamentos for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.agendamentos to authenticated;
