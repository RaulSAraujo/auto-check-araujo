-- Papéis de colaborador (recepção, mecânico, gerente)

create type public.colaborador_papel as enum ('recepcao', 'mecanico', 'gerente');

alter table public.profiles
  add column papel public.colaborador_papel not null default 'recepcao';

create or replace function public.auth_papel()
returns public.colaborador_papel
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (select papel from public.profiles where id = (select auth.uid())),
    'recepcao'::public.colaborador_papel
  );
$$;

revoke execute on function public.auth_papel() from public, anon;
grant execute on function public.auth_papel() to authenticated;

-- Perfis: leitura entre colaboradores (nome/papel em OS e permissões na UI)
drop policy if exists "Colaboradores leem o próprio perfil" on public.profiles;

create policy "Colaboradores leem perfis"
  on public.profiles for select
  to authenticated
  using (true);

-- Clientes
drop policy if exists "Colaboradores criam clientes" on public.clientes;
drop policy if exists "Colaboradores atualizam clientes" on public.clientes;
drop policy if exists "Colaboradores excluem clientes" on public.clientes;

create policy "Colaboradores criam clientes"
  on public.clientes for insert to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam clientes"
  on public.clientes for update to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente'))
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores excluem clientes"
  on public.clientes for delete to authenticated
  using (public.auth_papel() = 'gerente');

-- Veículos
drop policy if exists "Colaboradores criam veiculos" on public.veiculos;
drop policy if exists "Colaboradores atualizam veiculos" on public.veiculos;
drop policy if exists "Colaboradores excluem veiculos" on public.veiculos;

create policy "Colaboradores criam veiculos"
  on public.veiculos for insert to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam veiculos"
  on public.veiculos for update to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente'))
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores excluem veiculos"
  on public.veiculos for delete to authenticated
  using (public.auth_papel() = 'gerente');

-- Itens de orçamento
drop policy if exists "Colaboradores criam itens de ordem" on public.ordem_itens;
drop policy if exists "Colaboradores atualizam itens de ordem" on public.ordem_itens;
drop policy if exists "Colaboradores excluem itens de ordem" on public.ordem_itens;

create policy "Colaboradores criam itens de ordem"
  on public.ordem_itens for insert to authenticated
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores atualizam itens de ordem"
  on public.ordem_itens for update to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente'))
  with check (public.auth_papel() in ('recepcao', 'gerente'));

create policy "Colaboradores excluem itens de ordem"
  on public.ordem_itens for delete to authenticated
  using (public.auth_papel() in ('recepcao', 'gerente'));

-- Catálogo de serviços
drop policy if exists "Colaboradores criam catalogo" on public.servicos_catalogo;
drop policy if exists "Colaboradores atualizam catalogo" on public.servicos_catalogo;

create policy "Colaboradores criam catalogo"
  on public.servicos_catalogo for insert to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Colaboradores atualizam catalogo"
  on public.servicos_catalogo for update to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');
