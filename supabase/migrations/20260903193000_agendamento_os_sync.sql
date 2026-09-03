-- Liga agenda à OS: índice e sincroniza status do agendamento quando a OS muda

create index if not exists agendamentos_ordem_servico_id_idx
  on public.agendamentos (ordem_servico_id)
  where ordem_servico_id is not null;

create or replace function public.sync_agendamento_status_from_os()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_status text;
begin
  next_status := case
    when new.status = 'concluida' then 'concluido'
    when new.status = 'cancelada' then 'cancelado'
    when new.status in ('aberta', 'em_andamento', 'retrabalho') then 'em_atendimento'
    else null
  end;

  if next_status is null then
    return new;
  end if;

  update public.agendamentos
  set status = next_status
  where ordem_servico_id = new.id
    and status not in ('nao_compareceu', 'tratado');

  return new;
end;
$$;

drop trigger if exists agendamentos_sync_status_from_os on public.ordens_servico;

create trigger agendamentos_sync_status_from_os
  after insert or update of status
  on public.ordens_servico
  for each row
  execute function public.sync_agendamento_status_from_os();
