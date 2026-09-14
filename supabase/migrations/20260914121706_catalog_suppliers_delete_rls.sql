-- Allow gerente to hard-delete catalog items and suppliers

grant delete on public.servicos_catalogo to authenticated;
grant delete on public.fornecedores to authenticated;

drop policy if exists "Gerente exclui catalogo" on public.servicos_catalogo;
create policy "Gerente exclui catalogo"
  on public.servicos_catalogo for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');

drop policy if exists "Gerente exclui fornecedores" on public.fornecedores;
create policy "Gerente exclui fornecedores"
  on public.fornecedores for delete to authenticated
  using ((select public.auth_papel()) = 'gerente');
