-- Diagnosis text on OS + allow em_andamento before budget approval.
-- Conclusion still requires aprovado + pago (valor_total 0 skips pago).

alter table public.ordens_servico
  add column if not exists diagnostico text;

comment on column public.ordens_servico.diagnostico is
  'Achados da análise na oficina; distinto da reclamação do cliente.';

create or replace function public.validate_ordem_servico_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  p public.colaborador_papel := public.auth_papel();
begin
  if old.status = 'concluida' and new.status is distinct from old.status then
    raise exception 'OS concluída não pode mudar de status';
  end if;

  if old.status = 'concluida' then
    if (new.reclamacao, new.diagnostico, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.aberto_por, new.aberta_em,
        new.orcamento_public_token, new.concluida_em)
       is distinct from
       (old.reclamacao, old.diagnostico, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.aberto_por, old.aberta_em,
        old.orcamento_public_token, old.concluida_em) then
      raise exception 'OS concluída é somente leitura';
    end if;
  end if;

  -- em_andamento: análise pode começar sem orçamento aprovado

  if new.status = 'concluida' and old.status is distinct from 'concluida' then
    if new.orcamento_status is distinct from 'aprovado' then
      raise exception 'Aprove o orçamento antes de concluir a OS';
    end if;
    if coalesce(new.valor_total, 0) > 0 and coalesce(new.pago, false) is not true then
      raise exception 'Registre o pagamento antes de concluir a OS';
    end if;
  end if;

  if p is null then
    raise exception 'Sem permissão para alterar a ordem';
  end if;

  if p in ('recepcao', 'gerente') then
    return new;
  end if;

  if p = 'mecanico' then
    if (new.reclamacao, new.diagnostico, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.pago, new.forma_pagamento, new.pago_em,
        new.aberto_por, new.aberta_em, new.orcamento_public_token)
       is distinct from
       (old.reclamacao, old.diagnostico, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.pago, old.forma_pagamento, old.pago_em,
        old.aberto_por, old.aberta_em, old.orcamento_public_token) then
      raise exception 'Mecânico não pode alterar dados da ordem';
    end if;

    if old.status is distinct from new.status then
      if not (old.status = 'em_andamento' and new.status = 'concluida') then
        raise exception 'Mecânico só pode concluir ordens em andamento';
      end if;
    end if;

    return new;
  end if;

  raise exception 'Sem permissão para alterar a ordem';
end;
$$;
