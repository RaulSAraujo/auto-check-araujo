-- Orçamento: catálogo de serviços/peças e itens por OS

create table public.servicos_catalogo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('servico', 'peca')),
  valor_padrao numeric(10, 2) not null default 0 check (valor_padrao >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index servicos_catalogo_ativo_idx on public.servicos_catalogo (ativo, nome);

alter table public.servicos_catalogo enable row level security;

create policy "Colaboradores leem catalogo"
  on public.servicos_catalogo for select to authenticated using (true);
create policy "Colaboradores criam catalogo"
  on public.servicos_catalogo for insert to authenticated with check (true);
create policy "Colaboradores atualizam catalogo"
  on public.servicos_catalogo for update to authenticated using (true) with check (true);

alter table public.ordens_servico
  add column orcamento_status text not null default 'rascunho'
    check (orcamento_status in ('rascunho', 'aguardando_aprovacao', 'aprovado', 'rejeitado'));

create table public.ordem_itens (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  tipo text not null check (tipo in ('servico', 'peca')),
  descricao text not null,
  quantidade numeric(10, 2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(10, 2) not null default 0 check (valor_unitario >= 0),
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index ordem_itens_ordem_servico_id_idx
  on public.ordem_itens (ordem_servico_id, ordem);

alter table public.ordem_itens enable row level security;

create policy "Colaboradores leem itens de ordem"
  on public.ordem_itens for select to authenticated using (true);
create policy "Colaboradores criam itens de ordem"
  on public.ordem_itens for insert to authenticated with check (true);
create policy "Colaboradores atualizam itens de ordem"
  on public.ordem_itens for update to authenticated using (true) with check (true);
create policy "Colaboradores excluem itens de ordem"
  on public.ordem_itens for delete to authenticated using (true);

insert into public.servicos_catalogo (nome, tipo, valor_padrao) values
  ('Troca de óleo', 'servico', 150.00),
  ('Alinhamento e balanceamento', 'servico', 120.00),
  ('Revisão geral', 'servico', 250.00),
  ('Troca de pastilhas de freio', 'servico', 180.00),
  ('Diagnóstico eletrônico', 'servico', 100.00),
  ('Filtro de óleo', 'peca', 35.00),
  ('Filtro de ar', 'peca', 45.00),
  ('Óleo de motor 5W30 (litro)', 'peca', 42.00),
  ('Pastilha de freio (jogo)', 'peca', 120.00),
  ('Velas de ignição (jogo)', 'peca', 90.00);
