-- CRM clientes: status ativo/inativo + telefones/e-mails múltiplos

alter table public.clientes
  add column ativo boolean not null default true;

alter table public.clientes
  add column telefones text[] not null default '{}';

alter table public.clientes
  add column emails text[] not null default '{}';

alter table public.clientes
  add column contatos_busca text not null default '';

update public.clientes
set
  telefones = case
    when telefone is not null and btrim(telefone) <> '' then array[btrim(telefone)]
    else '{}'
  end,
  emails = case
    when email is not null and btrim(email) <> '' then array[btrim(email)]
    else '{}'
  end,
  contatos_busca = lower(
    coalesce(
      case
        when telefone is not null and btrim(telefone) <> '' then btrim(telefone)
        else ''
      end,
      ''
    ) || ' ' || coalesce(
      case
        when email is not null and btrim(email) <> '' then btrim(email)
        else ''
      end,
      ''
    )
  );

drop index if exists public.clientes_telefone_idx;

alter table public.clientes
  drop column telefone,
  drop column email;

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

create trigger clientes_set_contatos_busca
  before insert or update of telefones, emails on public.clientes
  for each row
  execute function public.clientes_set_contatos_busca();

create index clientes_ativo_idx on public.clientes (ativo);
create index clientes_contatos_busca_idx on public.clientes (contatos_busca);
create index clientes_telefones_gin_idx on public.clientes using gin (telefones);
create index clientes_emails_gin_idx on public.clientes using gin (emails);
