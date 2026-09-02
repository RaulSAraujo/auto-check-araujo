-- Catálogo: kits, fornecedores, custo e estoque

-- ---------------------------------------------------------------------------
-- Fornecedores
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
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza fornecedores"
  on public.fornecedores for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

grant select, insert, update on public.fornecedores to authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo: custo, estoque, fornecedor, tipo kit
-- ---------------------------------------------------------------------------

alter table public.servicos_catalogo
  drop constraint if exists servicos_catalogo_tipo_check;

alter table public.servicos_catalogo
  add constraint servicos_catalogo_tipo_check
  check (tipo in ('servico', 'peca', 'kit'));

alter table public.servicos_catalogo
  add column if not exists custo numeric(10, 2) not null default 0
    check (custo >= 0);

alter table public.servicos_catalogo
  add column if not exists estoque numeric(10, 2)
    check (estoque is null or estoque >= 0);

alter table public.servicos_catalogo
  add column if not exists fornecedor_id uuid
    references public.fornecedores (id) on delete set null;

create index if not exists servicos_catalogo_fornecedor_id_idx
  on public.servicos_catalogo (fornecedor_id);

create index if not exists servicos_catalogo_tipo_idx
  on public.servicos_catalogo (tipo, ativo, nome);

-- Peças existentes começam com estoque 0; serviços/kits sem controle
update public.servicos_catalogo
set estoque = 0
where tipo = 'peca' and estoque is null;

-- ---------------------------------------------------------------------------
-- Composição de kits
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

alter table public.catalogo_kit_itens enable row level security;

create policy "Colaboradores leem kit itens"
  on public.catalogo_kit_itens for select to authenticated using (true);

create policy "Gerente cria kit itens"
  on public.catalogo_kit_itens for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualiza kit itens"
  on public.catalogo_kit_itens for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente exclui kit itens"
  on public.catalogo_kit_itens for delete to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.catalogo_kit_itens to authenticated;

create or replace function public.validate_catalogo_kit_item()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_kit_tipo text;
  v_item_tipo text;
begin
  select tipo into v_kit_tipo from public.servicos_catalogo where id = new.kit_id;
  if v_kit_tipo is distinct from 'kit' then
    raise exception 'kit_id deve referenciar um item do tipo kit';
  end if;

  select tipo into v_item_tipo from public.servicos_catalogo where id = new.item_id;
  if v_item_tipo is null then
    raise exception 'item_id inválido';
  end if;
  if v_item_tipo = 'kit' then
    raise exception 'Kits não podem conter outros kits';
  end if;

  return new;
end;
$$;

drop trigger if exists catalogo_kit_itens_validate on public.catalogo_kit_itens;

create trigger catalogo_kit_itens_validate
  before insert or update of kit_id, item_id on public.catalogo_kit_itens
  for each row execute function public.validate_catalogo_kit_item();

-- ---------------------------------------------------------------------------
-- Itens de OS: permitir tipo kit
-- ---------------------------------------------------------------------------

alter table public.ordem_itens
  drop constraint if exists ordem_itens_tipo_check;

alter table public.ordem_itens
  add constraint ordem_itens_tipo_check
  check (tipo in ('servico', 'peca', 'kit'));
