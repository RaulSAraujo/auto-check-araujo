-- KM atual no veículo + sync a partir do km_entrada das OS

alter table public.veiculos
  add column km_atual integer
  check (km_atual is null or km_atual >= 0);

update public.veiculos v
set km_atual = sub.max_km
from (
  select
    veiculo_id,
    max(km_entrada) as max_km
  from public.ordens_servico
  where km_entrada is not null
  group by veiculo_id
) sub
where v.id = sub.veiculo_id
  and (v.km_atual is null or v.km_atual < sub.max_km);

create or replace function public.sync_veiculo_km_atual_from_ordem()
returns trigger
language plpgsql
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

drop trigger if exists ordens_servico_sync_veiculo_km on public.ordens_servico;

create trigger ordens_servico_sync_veiculo_km
  after insert or update of km_entrada, veiculo_id on public.ordens_servico
  for each row
  execute function public.sync_veiculo_km_atual_from_ordem();
