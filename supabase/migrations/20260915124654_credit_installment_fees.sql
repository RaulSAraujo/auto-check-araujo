-- Credit-card installment calculation and the selected installment count on each payment.

alter table public.oficina_parametros
  add column if not exists acrescimo_cartao_credito_parcela numeric(5, 2) not null default 0
    check (acrescimo_cartao_credito_parcela >= 0 and acrescimo_cartao_credito_parcela < 100);

alter table public.ordens_servico
  add column if not exists parcelas smallint;

update public.ordens_servico
set parcelas = 1
where forma_pagamento = 'cartao_credito'
  and parcelas is null;

alter table public.ordens_servico
  drop constraint if exists ordens_servico_parcelas_forma_pagamento_check;

alter table public.ordens_servico
  add constraint ordens_servico_parcelas_forma_pagamento_check
  check (
    (forma_pagamento = 'cartao_credito' and parcelas between 1 and 12)
    or (forma_pagamento is distinct from 'cartao_credito' and parcelas is null)
  );

comment on column public.oficina_parametros.acrescimo_cartao_credito_parcela is
  'Percentage added to the card fee for every installment after the first.';

comment on column public.ordens_servico.parcelas is
  'Credit-card installment count used when the payment was recorded.';
