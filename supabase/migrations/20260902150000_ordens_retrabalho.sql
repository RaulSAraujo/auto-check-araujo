-- Status retrabalho nas OS + dashboard conta retrabalho como em andamento

alter table public.ordens_servico
  drop constraint if exists ordens_servico_status_check;

alter table public.ordens_servico
  add constraint ordens_servico_status_check
  check (status in ('aberta', 'em_andamento', 'retrabalho', 'concluida', 'cancelada'));

create or replace function public.validate_ordem_servico_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  p public.colaborador_papel := public.auth_papel();
begin
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

create or replace function public.dashboard_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'clientes', (select count(*)::int from public.clientes),
    'veiculos', (select count(*)::int from public.veiculos),
    'os_abertas', (select count(*)::int from public.ordens_servico where status = 'aberta'),
    'os_andamento', (
      select count(*)::int
      from public.ordens_servico
      where status in ('em_andamento', 'retrabalho')
    )
  );
$$;
