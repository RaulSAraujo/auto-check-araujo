-- P1/P2: search_path KM, índices FK, policies (select auth_papel), merge profiles UPDATE
-- Continua hardening Postgres best practices

-- P1: search_path no trigger de KM
-- ---------------------------------------------------------------------------

create or replace function public.sync_veiculo_km_atual_from_ordem()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.km_entrada is null then
    return new;
  end if;

  update public.veiculos
  set km_atual = new.km_entrada
  where id = new.veiculo_id
    and (km_atual is null or km_atual < new.km_entrada);

  return new;
end;
$$;

revoke execute on function public.sync_veiculo_km_atual_from_ordem() from public, anon;

-- ---------------------------------------------------------------------------
-- P2: índices em FKs sem cobertura
-- ---------------------------------------------------------------------------

create index if not exists agendamentos_criado_por_idx
  on public.agendamentos (criado_por);

create index if not exists colaborador_presencas_registrado_por_idx
  on public.colaborador_presencas (registrado_por);

create index if not exists colaborador_faltas_registrado_por_idx
  on public.colaborador_faltas (registrado_por);

create index if not exists colaborador_ocorrencias_registrado_por_idx
  on public.colaborador_ocorrencias (registrado_por);

-- ---------------------------------------------------------------------------
-- P2: policies com (select auth_papel()) + merge UPDATE profiles
-- ---------------------------------------------------------------------------

-- profiles: uma policy UPDATE (evita multiple_permissive_policies)
drop policy if exists "Colaboradores atualizam próprio perfil" on public.profiles;
drop policy if exists "Gerente atualiza colaboradores" on public.profiles;

create policy "Colaboradores e gerente atualizam perfis"
  on public.profiles for update
  to authenticated
  using (
    (select auth.uid()) = id
    or (select public.auth_papel()) = 'gerente'
  )
  with check (
    (select auth.uid()) = id
    or (select public.auth_papel()) = 'gerente'
  );

-- Helper macros via drop/create (nomes existentes preservados)

drop policy if exists "Gerente exclui agendamentos" on public.agendamentos;
create policy "Gerente exclui agendamentos"
  on public.agendamentos for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Recepcao e gerente atualizam agendamentos" on public.agendamentos;
create policy "Recepcao e gerente atualizam agendamentos"
  on public.agendamentos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Recepcao e gerente criam agendamentos" on public.agendamentos;
create policy "Recepcao e gerente criam agendamentos"
  on public.agendamentos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Gerente atualiza kit itens" on public.catalogo_kit_itens;
create policy "Gerente atualiza kit itens"
  on public.catalogo_kit_itens for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria kit itens" on public.catalogo_kit_itens;
create policy "Gerente cria kit itens"
  on public.catalogo_kit_itens for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente exclui kit itens" on public.catalogo_kit_itens;
create policy "Gerente exclui kit itens"
  on public.catalogo_kit_itens for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Colaboradores criam fotos de checklist" on public.checklist_item_fotos;
create policy "Colaboradores criam fotos de checklist"
  on public.checklist_item_fotos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

drop policy if exists "Colaboradores excluem fotos de checklist" on public.checklist_item_fotos;
create policy "Colaboradores excluem fotos de checklist"
  on public.checklist_item_fotos for delete to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

drop policy if exists "Gerente atualiza template itens" on public.checklist_template_itens;
create policy "Gerente atualiza template itens"
  on public.checklist_template_itens for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria template itens" on public.checklist_template_itens;
create policy "Gerente cria template itens"
  on public.checklist_template_itens for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualiza templates" on public.checklist_templates;
create policy "Gerente atualiza templates"
  on public.checklist_templates for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria templates" on public.checklist_templates;
create policy "Gerente cria templates"
  on public.checklist_templates for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente exclui checklists" on public.checklists;
create policy "Gerente exclui checklists"
  on public.checklists for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Recepção e gerente criam checklists" on public.checklists;
create policy "Recepção e gerente criam checklists"
  on public.checklists for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores atualizam clientes" on public.clientes;
create policy "Colaboradores atualizam clientes"
  on public.clientes for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores criam clientes" on public.clientes;
create policy "Colaboradores criam clientes"
  on public.clientes for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores excluem clientes" on public.clientes;
create policy "Colaboradores excluem clientes"
  on public.clientes for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualizam faltas" on public.colaborador_faltas;
create policy "Gerente atualizam faltas"
  on public.colaborador_faltas for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente criam faltas" on public.colaborador_faltas;
create policy "Gerente criam faltas"
  on public.colaborador_faltas for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente excluem faltas" on public.colaborador_faltas;
create policy "Gerente excluem faltas"
  on public.colaborador_faltas for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente leem faltas" on public.colaborador_faltas;
create policy "Gerente leem faltas"
  on public.colaborador_faltas for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualizam ocorrencias" on public.colaborador_ocorrencias;
create policy "Gerente atualizam ocorrencias"
  on public.colaborador_ocorrencias for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente criam ocorrencias" on public.colaborador_ocorrencias;
create policy "Gerente criam ocorrencias"
  on public.colaborador_ocorrencias for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente excluem ocorrencias" on public.colaborador_ocorrencias;
create policy "Gerente excluem ocorrencias"
  on public.colaborador_ocorrencias for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente leem ocorrencias" on public.colaborador_ocorrencias;
create policy "Gerente leem ocorrencias"
  on public.colaborador_ocorrencias for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualizam presencas" on public.colaborador_presencas;
create policy "Gerente atualizam presencas"
  on public.colaborador_presencas for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente criam presencas" on public.colaborador_presencas;
create policy "Gerente criam presencas"
  on public.colaborador_presencas for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente excluem presencas" on public.colaborador_presencas;
create policy "Gerente excluem presencas"
  on public.colaborador_presencas for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente leem presencas" on public.colaborador_presencas;
create policy "Gerente leem presencas"
  on public.colaborador_presencas for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualiza categorias financeiras" on public.financeiro_categorias;
create policy "Gerente atualiza categorias financeiras"
  on public.financeiro_categorias for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria categorias financeiras" on public.financeiro_categorias;
create policy "Gerente cria categorias financeiras"
  on public.financeiro_categorias for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente exclui categorias financeiras" on public.financeiro_categorias;
create policy "Gerente exclui categorias financeiras"
  on public.financeiro_categorias for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente le categorias financeiras" on public.financeiro_categorias;
create policy "Gerente le categorias financeiras"
  on public.financeiro_categorias for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualiza contas financeiras" on public.financeiro_contas;
create policy "Gerente atualiza contas financeiras"
  on public.financeiro_contas for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria contas financeiras" on public.financeiro_contas;
create policy "Gerente cria contas financeiras"
  on public.financeiro_contas for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente exclui contas financeiras" on public.financeiro_contas;
create policy "Gerente exclui contas financeiras"
  on public.financeiro_contas for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente le contas financeiras" on public.financeiro_contas;
create policy "Gerente le contas financeiras"
  on public.financeiro_contas for select to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualiza fornecedores" on public.fornecedores;
create policy "Gerente atualiza fornecedores"
  on public.fornecedores for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente cria fornecedores" on public.fornecedores;
create policy "Gerente cria fornecedores"
  on public.fornecedores for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente atualiza parametros de precificacao" on public.oficina_parametros;
create policy "Gerente atualiza parametros de precificacao"
  on public.oficina_parametros for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Colaboradores atualizam itens de ordem" on public.ordem_itens;
create policy "Colaboradores atualizam itens de ordem"
  on public.ordem_itens for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores criam itens de ordem" on public.ordem_itens;
create policy "Colaboradores criam itens de ordem"
  on public.ordem_itens for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores excluem itens de ordem" on public.ordem_itens;
create policy "Colaboradores excluem itens de ordem"
  on public.ordem_itens for delete to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Gerente exclui ordens" on public.ordens_servico;
create policy "Gerente exclui ordens"
  on public.ordens_servico for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Recepção e gerente criam ordens" on public.ordens_servico;
create policy "Recepção e gerente criam ordens"
  on public.ordens_servico for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores atualizam catalogo" on public.servicos_catalogo;
create policy "Colaboradores atualizam catalogo"
  on public.servicos_catalogo for update to authenticated
  using ((select public.auth_papel()) = 'gerente')
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Colaboradores criam catalogo" on public.servicos_catalogo;
create policy "Colaboradores criam catalogo"
  on public.servicos_catalogo for insert to authenticated
  with check ((select public.auth_papel()) = 'gerente');

drop policy if exists "Colaboradores atualizam veiculos" on public.veiculos;
create policy "Colaboradores atualizam veiculos"
  on public.veiculos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores criam veiculos" on public.veiculos;
create policy "Colaboradores criam veiculos"
  on public.veiculos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente'));

drop policy if exists "Colaboradores excluem veiculos" on public.veiculos;
create policy "Colaboradores excluem veiculos"
  on public.veiculos for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

-- Storage (fotos de checklist), se as policies existirem
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Colaboradores enviam fotos de checklist'
  ) then
    execute 'drop policy "Colaboradores enviam fotos de checklist" on storage.objects';
    execute $p$
      create policy "Colaboradores enviam fotos de checklist"
        on storage.objects for insert to authenticated
        with check (
          bucket_id = 'checklist-fotos'
          and (select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico')
        )
    $p$;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Colaboradores removem fotos de checklist'
  ) then
    execute 'drop policy "Colaboradores removem fotos de checklist" on storage.objects';
    execute $p$
      create policy "Colaboradores removem fotos de checklist"
        on storage.objects for delete to authenticated
        using (
          bucket_id = 'checklist-fotos'
          and (select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico')
        )
    $p$;
  end if;
end;
$$;
