-- Pricing motor slice 1: service hour seed + charged amount on payment

alter table public.servicos_catalogo
  add column if not exists horas_estimadas numeric(8, 2),
  add column if not exists preco_manual boolean not null default false;

comment on column public.servicos_catalogo.horas_estimadas is
  'Estimated labor hours for tipo=servico; used to seed valor_padrao from oficina hourly rate.';
comment on column public.servicos_catalogo.preco_manual is
  'When true, valor_padrao was overridden and must not be overwritten by hours × rate.';

alter table public.ordens_servico
  add column if not exists valor_cobrado numeric(12, 2);

comment on column public.ordens_servico.valor_cobrado is
  'Amount charged to the customer (may exceed valor_total when card fee is passed through).';

alter table public.ordens_servico
  drop constraint if exists ordens_servico_valor_cobrado_nonneg;

alter table public.ordens_servico
  add constraint ordens_servico_valor_cobrado_nonneg
  check (valor_cobrado is null or valor_cobrado >= 0);

alter table public.servicos_catalogo
  drop constraint if exists servicos_catalogo_horas_estimadas_nonneg;

alter table public.servicos_catalogo
  add constraint servicos_catalogo_horas_estimadas_nonneg
  check (horas_estimadas is null or horas_estimadas >= 0);
