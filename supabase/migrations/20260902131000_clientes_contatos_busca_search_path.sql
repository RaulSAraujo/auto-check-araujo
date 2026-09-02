-- Fix search_path on clientes_set_contatos_busca trigger function

create or replace function public.clientes_set_contatos_busca()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.contatos_busca := lower(
    coalesce(array_to_string(new.telefones, ' '), '') || ' ' ||
    coalesce(array_to_string(new.emails, ' '), '')
  );
  return new;
end;
$$;
