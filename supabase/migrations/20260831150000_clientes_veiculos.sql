-- Clientes, veículos e perfis de colaboradores
-- RLS: apenas authenticated

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Colaboradores leem o próprio perfil"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Colaboradores atualizam o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Colaboradores inserem o próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  documento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_nome_idx on public.clientes (nome);
create index clientes_telefone_idx on public.clientes (telefone);
create index clientes_documento_idx on public.clientes (documento);

alter table public.clientes enable row level security;

create policy "Colaboradores leem clientes"
  on public.clientes for select
  to authenticated
  using (true);

create policy "Colaboradores criam clientes"
  on public.clientes for insert
  to authenticated
  with check (true);

create policy "Colaboradores atualizam clientes"
  on public.clientes for update
  to authenticated
  using (true)
  with check (true);

create policy "Colaboradores excluem clientes"
  on public.clientes for delete
  to authenticated
  using (true);

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  placa text not null,
  marca text,
  modelo text,
  ano integer,
  cor text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veiculos_placa_format check (placa ~ '^[A-Z0-9]{7}$'),
  constraint veiculos_ano_range check (ano is null or (ano >= 1950 and ano <= 2100))
);

create unique index veiculos_placa_unique on public.veiculos (placa);
create index veiculos_cliente_id_idx on public.veiculos (cliente_id);
create index veiculos_placa_idx on public.veiculos (placa);

alter table public.veiculos enable row level security;

create policy "Colaboradores leem veiculos"
  on public.veiculos for select
  to authenticated
  using (true);

create policy "Colaboradores criam veiculos"
  on public.veiculos for insert
  to authenticated
  with check (true);

create policy "Colaboradores atualizam veiculos"
  on public.veiculos for update
  to authenticated
  using (true)
  with check (true);

create policy "Colaboradores excluem veiculos"
  on public.veiculos for delete
  to authenticated
  using (true);

create or replace function public.normalize_placa()
returns trigger
language plpgsql
as $$
begin
  new.placa := upper(regexp_replace(new.placa, '[^A-Za-z0-9]', '', 'g'));
  return new;
end;
$$;

create trigger veiculos_normalize_placa
  before insert or update of placa on public.veiculos
  for each row execute function public.normalize_placa();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger veiculos_set_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();
