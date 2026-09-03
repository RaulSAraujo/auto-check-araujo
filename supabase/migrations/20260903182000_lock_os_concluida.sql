-- OS concluída: trava status e dados (exceto registro de pagamento).

create or replace function public.validate_ordem_servico_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  p public.colaborador_papel := public.auth_papel();
begin
  -- Conclusão é definitiva: não reabre nem muda status
  if old.status = 'concluida' and new.status is distinct from old.status then
    raise exception 'OS concluída não pode mudar de status';
  end if;

  if old.status = 'concluida' then
    if (new.reclamacao, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.aberto_por, new.aberta_em,
        new.orcamento_public_token, new.concluida_em)
       is distinct from
       (old.reclamacao, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.aberto_por, old.aberta_em,
        old.orcamento_public_token, old.concluida_em) then
      raise exception 'OS concluída é somente leitura';
    end if;
  end if;

  if p in ('recepcao', 'gerente') then
    if p <> 'gerente' then
      if new.pago is distinct from old.pago
        or new.forma_pagamento is distinct from old.forma_pagamento
        or new.pago_em is distinct from old.pago_em then
        raise exception 'Apenas gerentes podem registrar pagamento';
      end if;
    end if;

    return new;
  end if;

  if p = 'mecanico' then
    if (new.reclamacao, new.km_entrada, new.observacoes, new.veiculo_id, new.numero,
        new.orcamento_status, new.valor_total, new.pago, new.forma_pagamento, new.pago_em,
        new.aberto_por, new.aberta_em, new.orcamento_public_token)
       is distinct from
       (old.reclamacao, old.km_entrada, old.observacoes, old.veiculo_id, old.numero,
        old.orcamento_status, old.valor_total, old.pago, old.forma_pagamento, old.pago_em,
        old.aberto_por, old.aberta_em, old.orcamento_public_token) then
      raise exception 'Mecânico não pode alterar dados da ordem';
    end if;

    if old.status is distinct from new.status then
      if not (
        (old.status = 'em_andamento' and new.status = 'concluida')
        or (old.status = 'retrabalho' and new.status = 'concluida')
      ) then
        raise exception 'Mecânico só pode concluir ordens em andamento ou em retrabalho';
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;
