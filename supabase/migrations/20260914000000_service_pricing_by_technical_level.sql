alter table public.oficina_parametros
  add column if not exists valor_minimo_servico numeric(10, 2) not null default 150
    check (valor_minimo_servico >= 0),
  add column if not exists fator_servico_rapido numeric(5, 2) not null default 0.8
    check (fator_servico_rapido > 0),
  add column if not exists fator_servico_padrao numeric(5, 2) not null default 1
    check (fator_servico_padrao > 0),
  add column if not exists fator_servico_tecnico numeric(5, 2) not null default 1.35
    check (fator_servico_tecnico > 0),
  add column if not exists fator_servico_especializado numeric(5, 2) not null default 1.7
    check (fator_servico_especializado > 0);

alter table public.servicos_catalogo
  add column if not exists nivel_tecnico text not null default 'padrao'
    check (nivel_tecnico in ('rapido', 'padrao', 'tecnico', 'especializado'));

comment on column public.servicos_catalogo.horas_estimadas is
  'Estimated duration used with the workshop hourly rate and technical level to suggest valor_padrao.';

comment on column public.servicos_catalogo.nivel_tecnico is
  'Technical complexity used to apply the workshop service pricing factor.';
