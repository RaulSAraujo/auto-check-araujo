-- Single-request typeahead for veículos (placa/marca/modelo/cliente).
-- SECURITY INVOKER so RLS on veiculos/clientes still applies.
-- Indexes: veiculos(placa), veiculos(cliente_id), clientes(nome) already exist.
-- Leading-wildcard ILIKE won't use btree; fine for oficina-scale catalogs.
-- For large catalogs later: pg_trgm GIN on placa/nome (see advanced-full-text-search).

create or replace function public.search_vehicle_options(
  p_search text default null,
  p_limit integer default 40,
  p_preferred_id uuid default null
)
returns table (
  id uuid,
  placa text,
  marca text,
  modelo text,
  cliente_id uuid,
  cliente_nome text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 40), 100));
  v_raw text := nullif(btrim(coalesce(p_search, '')), '');
  v_safe text;
  v_pattern text;
  v_placa_pattern text;
begin
  if v_raw is not null then
    -- Mirror client sanitizeIlikeTerm: strip ILIKE / PostgREST metacharacters
    v_safe := nullif(btrim(regexp_replace(v_raw, '[%_,().\\]', '', 'g')), '');
  end if;

  if v_safe is not null then
    v_pattern := '%' || v_safe || '%';
    v_placa_pattern := '%' || regexp_replace(upper(v_safe), '[^A-Z0-9]', '', 'g') || '%';
    if v_placa_pattern = '%%' then
      v_placa_pattern := v_pattern;
    end if;
  end if;

  return query
  with matched as (
    select
      v.id,
      v.placa,
      v.marca,
      v.modelo,
      c.id as cliente_id,
      c.nome as cliente_nome
    from public.veiculos v
    inner join public.clientes c on c.id = v.cliente_id
    where v_pattern is null
      or v.placa ilike v_placa_pattern
      or coalesce(v.marca, '') ilike v_pattern
      or coalesce(v.modelo, '') ilike v_pattern
      or c.nome ilike v_pattern
    order by v.placa asc
    limit v_limit
  ),
  preferred as (
    select
      v.id,
      v.placa,
      v.marca,
      v.modelo,
      c.id as cliente_id,
      c.nome as cliente_nome
    from public.veiculos v
    inner join public.clientes c on c.id = v.cliente_id
    where p_preferred_id is not null
      and v.id = p_preferred_id
      and not exists (
        select 1 from matched m where m.id = p_preferred_id
      )
  )
  select p.id, p.placa, p.marca, p.modelo, p.cliente_id, p.cliente_nome
  from preferred p
  union all
  select m.id, m.placa, m.marca, m.modelo, m.cliente_id, m.cliente_nome
  from matched m;
end;
$$;

revoke all on function public.search_vehicle_options(text, integer, uuid) from public;
grant execute on function public.search_vehicle_options(text, integer, uuid) to authenticated;

comment on function public.search_vehicle_options(text, integer, uuid) is
  'Typeahead de veículos: uma query com OR em placa/marca/modelo/nome do cliente.';
