-- Recria o domínio operacional após o drop seletivo.
-- Preserva: profiles, oficina_parametros, servicos_catalogo (dados e estrutura).
-- Funções públicas já existentes são reutilizadas; só tabelas/triggers/policies/índices.

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  observacoes text,
  ativo boolean not null default true,
  telefones text[] not null default '{}',
  emails text[] not null default '{}',
  contatos_busca text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_nome_idx on public.clientes (nome);
create index clientes_documento_idx on public.clientes (documento);
create index clientes_ativo_idx on public.clientes (ativo);
create index clientes_contatos_busca_idx on public.clientes (contatos_busca);
create index clientes_telefones_gin_idx on public.clientes using gin (telefones);
create index clientes_emails_gin_idx on public.clientes using gin (emails);

create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger clientes_set_contatos_busca
  before insert or update of telefones, emails on public.clientes
  for each row execute function public.clientes_set_contatos_busca();

alter table public.clientes enable row level security;

create policy "Colaboradores leem clientes"
  on public.clientes for select to authenticated using (true);

create policy "Colaboradores criam clientes"
  on public.clientes for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam clientes"
  on public.clientes for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores excluem clientes"
  on public.clientes for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.clientes to authenticated;

-- ---------------------------------------------------------------------------
-- Veículos
-- ---------------------------------------------------------------------------

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  placa text not null,
  marca text,
  modelo text,
  ano integer,
  cor text,
  observacoes text,
  km_atual integer check (km_atual is null or km_atual >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veiculos_placa_format check (placa ~ '^[A-Z0-9]{7}$'),
  constraint veiculos_ano_range check (ano is null or (ano >= 1950 and ano <= 2100))
);

create unique index veiculos_placa_unique on public.veiculos (placa);
create index veiculos_cliente_id_idx on public.veiculos (cliente_id);
create index veiculos_placa_idx on public.veiculos (placa);

create trigger veiculos_normalize_placa
  before insert or update of placa on public.veiculos
  for each row execute function public.normalize_placa();

create trigger veiculos_set_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();

alter table public.veiculos enable row level security;

create policy "Colaboradores leem veiculos"
  on public.veiculos for select to authenticated using (true);

create policy "Colaboradores criam veiculos"
  on public.veiculos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam veiculos"
  on public.veiculos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores excluem veiculos"
  on public.veiculos for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.veiculos to authenticated;

-- ---------------------------------------------------------------------------
-- Ordens de serviço
-- ---------------------------------------------------------------------------

create sequence if not exists public.ordens_servico_numero_seq;

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,
  aberto_por uuid not null references public.profiles (id) on delete restrict,
  numero text not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  reclamacao text,
  diagnostico text,
  km_entrada integer check (km_entrada is null or km_entrada >= 0),
  observacoes text,
  orcamento_status text not null default 'rascunho'
    check (orcamento_status in ('rascunho', 'aguardando_aprovacao', 'aprovado', 'rejeitado')),
  orcamento_public_token uuid unique,
  valor_total numeric(10, 2) check (valor_total is null or valor_total >= 0),
  valor_cobrado numeric(12, 2),
  pago boolean not null default false,
  pago_em timestamptz,
  forma_pagamento text
    check (
      forma_pagamento is null
      or forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')
    ),
  parcelas smallint,
  aberta_em timestamptz not null default now(),
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ordens_servico_numero_unique unique (numero),
  constraint ordens_servico_valor_cobrado_nonneg
    check (valor_cobrado is null or valor_cobrado >= 0),
  constraint ordens_servico_parcelas_forma_pagamento_check
    check (
      (forma_pagamento = 'cartao_credito' and parcelas between 1 and 12)
      or (forma_pagamento is distinct from 'cartao_credito' and parcelas is null)
    )
);

comment on column public.ordens_servico.diagnostico is
  'Achados da análise na oficina; distinto da reclamação do cliente.';
comment on column public.ordens_servico.valor_cobrado is
  'Amount charged to the customer (may exceed valor_total when card fee is passed through).';
comment on column public.ordens_servico.parcelas is
  'Credit-card installment count used when the payment was recorded.';

create index ordens_servico_veiculo_id_idx on public.ordens_servico (veiculo_id);
create index ordens_servico_status_idx on public.ordens_servico (status);
create index ordens_servico_aberta_em_idx on public.ordens_servico (aberta_em desc);
create index ordens_servico_aberto_por_idx on public.ordens_servico (aberto_por);
create index ordens_servico_updated_at_idx on public.ordens_servico (updated_at desc);
create index ordens_servico_pago_em_idx
  on public.ordens_servico (pago_em)
  where pago = true and pago_em is not null;
create index ordens_servico_public_token_idx
  on public.ordens_servico (orcamento_public_token)
  where orcamento_public_token is not null;

create trigger ordens_servico_gerar_numero
  before insert on public.ordens_servico
  for each row execute function public.gerar_numero_os();

create trigger ordens_servico_set_updated_at
  before update on public.ordens_servico
  for each row execute function public.set_updated_at();

create trigger ordens_servico_sync_valor_on_approve
  before insert or update of orcamento_status on public.ordens_servico
  for each row execute function public.trg_sync_valor_on_budget_approve();

create trigger ordens_servico_validate_update
  before update on public.ordens_servico
  for each row execute function public.validate_ordem_servico_update();

create trigger ordens_servico_sync_veiculo_km
  after insert or update of km_entrada, veiculo_id on public.ordens_servico
  for each row execute function public.sync_veiculo_km_atual_from_ordem();

alter table public.ordens_servico enable row level security;

create policy "Colaboradores leem ordens"
  on public.ordens_servico for select to authenticated using (true);

create policy "Recepção e gerente criam ordens"
  on public.ordens_servico for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam ordens"
  on public.ordens_servico for update to authenticated
  using (true)
  with check (true);

create policy "Gerente exclui ordens"
  on public.ordens_servico for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.ordens_servico to authenticated;

-- ---------------------------------------------------------------------------
-- Itens de OS
-- ---------------------------------------------------------------------------

create table public.ordem_itens (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  tipo text not null check (tipo in ('servico', 'peca', 'kit')),
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
  on public.ordem_itens for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam itens de ordem"
  on public.ordem_itens for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Colaboradores excluem itens de ordem"
  on public.ordem_itens for delete to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'));

grant select, insert, update, delete on public.ordem_itens to authenticated;

-- ---------------------------------------------------------------------------
-- Fotos da OS
-- ---------------------------------------------------------------------------

create table public.ordem_fotos (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  storage_path text not null,
  nome_arquivo text,
  legenda text,
  created_at timestamptz not null default now(),
  constraint ordem_fotos_storage_path_unique unique (storage_path)
);

create index ordem_fotos_ordem_servico_id_idx
  on public.ordem_fotos (ordem_servico_id, created_at);

alter table public.ordem_fotos enable row level security;

create policy "Colaboradores leem fotos da OS"
  on public.ordem_fotos for select to authenticated using (true);

create policy "Colaboradores criam fotos da OS"
  on public.ordem_fotos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

create policy "Colaboradores atualizam fotos da OS"
  on public.ordem_fotos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

create policy "Colaboradores excluem fotos da OS"
  on public.ordem_fotos for delete to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

grant select, insert, update, delete on public.ordem_fotos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ordem-fotos',
  'ordem-fotos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Fornecedores + FK de volta no catálogo preservado
-- ---------------------------------------------------------------------------

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index fornecedores_ativo_nome_idx on public.fornecedores (ativo, nome);

alter table public.fornecedores enable row level security;

create policy "Colaboradores leem fornecedores"
  on public.fornecedores for select to authenticated using (true);

create policy "Gerente cria fornecedores"
  on public.fornecedores for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente atualiza fornecedores"
  on public.fornecedores for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente exclui fornecedores"
  on public.fornecedores for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.fornecedores to authenticated;

-- Catálogo preservado pode ter UUIDs órfãos após o drop de fornecedores
update public.servicos_catalogo
set fornecedor_id = null
where fornecedor_id is not null;

alter table public.servicos_catalogo
  drop constraint if exists servicos_catalogo_fornecedor_id_fkey;

alter table public.servicos_catalogo
  add constraint servicos_catalogo_fornecedor_id_fkey
  foreign key (fornecedor_id) references public.fornecedores (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Kits do catálogo
-- ---------------------------------------------------------------------------

create table public.catalogo_kit_itens (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.servicos_catalogo (id) on delete cascade,
  item_id uuid not null references public.servicos_catalogo (id) on delete restrict,
  quantidade numeric(10, 2) not null default 1 check (quantidade > 0),
  created_at timestamptz not null default now(),
  constraint catalogo_kit_itens_kit_item_unique unique (kit_id, item_id),
  constraint catalogo_kit_itens_no_self check (kit_id <> item_id)
);

create index catalogo_kit_itens_kit_id_idx on public.catalogo_kit_itens (kit_id);
create index catalogo_kit_itens_item_id_idx on public.catalogo_kit_itens (item_id);

create trigger catalogo_kit_itens_validate
  before insert or update of kit_id, item_id on public.catalogo_kit_itens
  for each row execute function public.validate_catalogo_kit_item();

alter table public.catalogo_kit_itens enable row level security;

create policy "Colaboradores leem kit itens"
  on public.catalogo_kit_itens for select to authenticated using (true);

create policy "Gerente cria kit itens"
  on public.catalogo_kit_itens for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente atualiza kit itens"
  on public.catalogo_kit_itens for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente exclui kit itens"
  on public.catalogo_kit_itens for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.catalogo_kit_itens to authenticated;

-- ---------------------------------------------------------------------------
-- Agendamentos
-- ---------------------------------------------------------------------------

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
      'tratado',
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
create index agendamentos_criado_por_idx on public.agendamentos (criado_por);
create index agendamentos_ordem_servico_id_idx
  on public.agendamentos (ordem_servico_id)
  where ordem_servico_id is not null;
create index agendamentos_patio_vaga_idx
  on public.agendamentos (patio_vaga)
  where patio_vaga is not null
    and status not in ('cancelado', 'nao_compareceu', 'concluido', 'tratado');

create trigger agendamentos_set_updated_at
  before update on public.agendamentos
  for each row execute function public.set_updated_at();

create trigger agendamentos_sync_status_from_os
  after insert or update of status on public.ordens_servico
  for each row execute function public.sync_agendamento_status_from_os();

alter table public.agendamentos enable row level security;

create policy "Colaboradores leem agendamentos"
  on public.agendamentos for select to authenticated using (true);

create policy "Recepcao e gerente criam agendamentos"
  on public.agendamentos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Recepcao e gerente atualizam agendamentos"
  on public.agendamentos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

create policy "Gerente exclui agendamentos"
  on public.agendamentos for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.agendamentos to authenticated;

-- ---------------------------------------------------------------------------
-- Financeiro
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
  using ((select public.auth_papel()) = 'gerente');

create policy "Gerente cria categorias financeiras"
  on public.financeiro_categorias for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente atualiza categorias financeiras"
  on public.financeiro_categorias for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente exclui categorias financeiras"
  on public.financeiro_categorias for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

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

create trigger financeiro_contas_pago_em
  before insert or update on public.financeiro_contas
  for each row execute function public.trg_financeiro_contas_pago_em();

alter table public.financeiro_contas enable row level security;

create policy "Gerente le contas financeiras"
  on public.financeiro_contas for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

create policy "Gerente cria contas financeiras"
  on public.financeiro_contas for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente atualiza contas financeiras"
  on public.financeiro_contas for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

create policy "Gerente exclui contas financeiras"
  on public.financeiro_contas for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

grant select, insert, update, delete on public.financeiro_contas to authenticated;
