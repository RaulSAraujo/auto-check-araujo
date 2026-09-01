-- Ordens de serviço, checklists e templates de inspeção

create sequence public.ordens_servico_numero_seq;

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,
  aberto_por uuid not null references public.profiles (id) on delete restrict,
  numero text not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  reclamacao text,
  km_entrada integer check (km_entrada is null or km_entrada >= 0),
  observacoes text,
  aberta_em timestamptz not null default now(),
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ordens_servico_numero_unique unique (numero)
);

create index ordens_servico_veiculo_id_idx on public.ordens_servico (veiculo_id);
create index ordens_servico_status_idx on public.ordens_servico (status);
create index ordens_servico_aberta_em_idx on public.ordens_servico (aberta_em desc);

create or replace function public.gerar_numero_os()
returns trigger
language plpgsql
as $$
declare
  seq bigint;
  ano text;
begin
  if new.numero is null or new.numero = '' then
    seq := nextval('public.ordens_servico_numero_seq');
    ano := to_char(timezone('America/Sao_Paulo', now()), 'YYYY');
    new.numero := 'OS-' || ano || '-' || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger ordens_servico_gerar_numero
  before insert on public.ordens_servico
  for each row execute function public.gerar_numero_os();

create trigger ordens_servico_set_updated_at
  before update on public.ordens_servico
  for each row execute function public.set_updated_at();

alter table public.ordens_servico enable row level security;

create policy "Colaboradores leem ordens"
  on public.ordens_servico for select to authenticated using (true);
create policy "Colaboradores criam ordens"
  on public.ordens_servico for insert to authenticated with check (true);
create policy "Colaboradores atualizam ordens"
  on public.ordens_servico for update to authenticated using (true) with check (true);
create policy "Colaboradores excluem ordens"
  on public.ordens_servico for delete to authenticated using (true);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.checklist_template_itens (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  categoria text not null,
  label text not null,
  ordem integer not null default 0
);

create index checklist_template_itens_template_id_idx
  on public.checklist_template_itens (template_id, ordem);

alter table public.checklist_templates enable row level security;
alter table public.checklist_template_itens enable row level security;

create policy "Colaboradores leem templates"
  on public.checklist_templates for select to authenticated using (true);
create policy "Colaboradores leem template itens"
  on public.checklist_template_itens for select to authenticated using (true);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  status text not null default 'em_preenchimento'
    check (status in ('em_preenchimento', 'concluida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklists_ordem_servico_unique unique (ordem_servico_id)
);

create trigger checklists_set_updated_at
  before update on public.checklists
  for each row execute function public.set_updated_at();

alter table public.checklists enable row level security;

create policy "Colaboradores leem checklists"
  on public.checklists for select to authenticated using (true);
create policy "Colaboradores criam checklists"
  on public.checklists for insert to authenticated with check (true);
create policy "Colaboradores atualizam checklists"
  on public.checklists for update to authenticated using (true) with check (true);
create policy "Colaboradores excluem checklists"
  on public.checklists for delete to authenticated using (true);

create table public.checklist_itens (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists (id) on delete cascade,
  categoria text not null,
  label text not null,
  ordem integer not null default 0,
  resultado text check (resultado is null or resultado in ('ok', 'atencao', 'ruim', 'na')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checklist_itens_checklist_id_idx
  on public.checklist_itens (checklist_id, ordem);

create trigger checklist_itens_set_updated_at
  before update on public.checklist_itens
  for each row execute function public.set_updated_at();

alter table public.checklist_itens enable row level security;

create policy "Colaboradores leem checklist itens"
  on public.checklist_itens for select to authenticated using (true);
create policy "Colaboradores criam checklist itens"
  on public.checklist_itens for insert to authenticated with check (true);
create policy "Colaboradores atualizam checklist itens"
  on public.checklist_itens for update to authenticated using (true) with check (true);
create policy "Colaboradores excluem checklist itens"
  on public.checklist_itens for delete to authenticated using (true);

-- Função: cria checklist a partir do template ativo (snapshot)
create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checklist_id uuid;
  v_template_id uuid;
  v_existing uuid;
begin
  select id into v_existing
  from public.checklists
  where ordem_servico_id = p_ordem_servico_id;

  if v_existing is not null then
    return v_existing;
  end if;

  select id into v_template_id
  from public.checklist_templates
  where ativo = true
  order by created_at asc
  limit 1;

  if v_template_id is null then
    raise exception 'Nenhum template de checklist ativo';
  end if;

  insert into public.checklists (ordem_servico_id, status)
  values (p_ordem_servico_id, 'em_preenchimento')
  returning id into v_checklist_id;

  insert into public.checklist_itens (checklist_id, categoria, label, ordem)
  select v_checklist_id, categoria, label, ordem
  from public.checklist_template_itens
  where template_id = v_template_id
  order by ordem;

  update public.ordens_servico
  set status = case when status = 'aberta' then 'em_andamento' else status end
  where id = p_ordem_servico_id;

  return v_checklist_id;
end;
$$;

grant execute on function public.criar_checklist_da_os(uuid) to authenticated;

-- Seed template padrão
do $$
declare
  tid uuid;
begin
  insert into public.checklist_templates (nome, ativo)
  values ('Inspeção de entrada', true)
  returning id into tid;

  insert into public.checklist_template_itens (template_id, categoria, label, ordem) values
    (tid, 'Exterior', 'Lataria / parachoques', 1),
    (tid, 'Exterior', 'Vidros e retrovisores', 2),
    (tid, 'Exterior', 'Faróis e lanternas', 3),
    (tid, 'Exterior', 'Pneus e estepe', 4),
    (tid, 'Exterior', 'Palhetas do limpador', 5),
    (tid, 'Interior', 'Painel de instrumentos / luzes de alerta', 10),
    (tid, 'Interior', 'Cintos de segurança', 11),
    (tid, 'Interior', 'Ar-condicionado / ventilação', 12),
    (tid, 'Interior', 'Estofamento e forrações', 13),
    (tid, 'Motor', 'Nível de óleo do motor', 20),
    (tid, 'Motor', 'Fluido de arrefecimento', 21),
    (tid, 'Motor', 'Fluido de freio', 22),
    (tid, 'Motor', 'Fluido da direção / transmissão', 23),
    (tid, 'Motor', 'Correias e mangueiras', 24),
    (tid, 'Motor', 'Bateria e terminais', 25),
    (tid, 'Freios e suspensão', 'Freio de serviço', 30),
    (tid, 'Freios e suspensão', 'Freio de estacionamento', 31),
    (tid, 'Freios e suspensão', 'Suspensão / ruídos', 32),
    (tid, 'Elétrica', 'Partida e alternador', 40),
    (tid, 'Elétrica', 'Limpadores e buzina', 41),
    (tid, 'Documentação', 'Documentos e itens de segurança no veículo', 50);
end;
$$;
