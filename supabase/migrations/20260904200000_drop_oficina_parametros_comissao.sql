-- Remove unused commission column (only consumed by retired /vendas screen)

alter table public.oficina_parametros
  drop column if exists comissao_percentual;
