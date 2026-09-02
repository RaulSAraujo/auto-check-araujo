-- Checklist passa a ser criado vazio; itens são adicionados manualmente na OS.

create or replace function public.criar_checklist_da_os(p_ordem_servico_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checklist_id uuid;
  v_existing uuid;
begin
  if public.auth_papel() not in ('recepcao', 'gerente') then
    raise exception 'Sem permissão para iniciar checklist';
  end if;

  select id into v_existing
  from public.checklists
  where ordem_servico_id = p_ordem_servico_id;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.checklists (ordem_servico_id, status)
  values (p_ordem_servico_id, 'em_preenchimento')
  returning id into v_checklist_id;

  update public.ordens_servico
  set status = case when status = 'aberta' then 'em_andamento' else status end
  where id = p_ordem_servico_id;

  return v_checklist_id;
end;
$$;
