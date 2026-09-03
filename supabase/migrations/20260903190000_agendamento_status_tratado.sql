-- Status "tratado" para não comparecimentos resolvidos (sem reaproveitar cancelado)

alter table public.agendamentos
  drop constraint if exists agendamentos_status_check;

alter table public.agendamentos
  add constraint agendamentos_status_check
  check (status in (
    'agendado',
    'confirmado',
    'em_atendimento',
    'concluido',
    'nao_compareceu',
    'tratado',
    'cancelado'
  ));

drop index if exists public.agendamentos_patio_vaga_idx;

create index agendamentos_patio_vaga_idx
  on public.agendamentos (patio_vaga)
  where patio_vaga is not null
    and status not in ('cancelado', 'nao_compareceu', 'concluido', 'tratado');
