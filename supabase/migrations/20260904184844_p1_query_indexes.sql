-- P1/P2: indexes for Kanban (updated_at) and finance history (pago_em)

create index if not exists ordens_servico_updated_at_idx
  on public.ordens_servico (updated_at desc);

create index if not exists ordens_servico_pago_em_idx
  on public.ordens_servico (pago_em)
  where pago = true and pago_em is not null;
