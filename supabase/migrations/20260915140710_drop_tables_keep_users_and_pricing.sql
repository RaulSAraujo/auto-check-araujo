-- Recomeça o domínio da oficina preservando apenas identidade e precificação.
-- auth.users fica no schema auth e não é afetada por esta migration.
do $$
declare
  table_name text;
begin
  for table_name in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in (
        'profiles',
        'oficina_parametros',
        'servicos_catalogo'
      )
  loop
    execute format('drop table if exists public.%I cascade', table_name);
  end loop;
end;
$$;
