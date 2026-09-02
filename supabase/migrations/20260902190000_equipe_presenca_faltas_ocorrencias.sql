-- Gestão da equipe: presença, faltas, ocorrências e indicadores

-- ---------------------------------------------------------------------------
-- Presenças (registro diário)
-- ---------------------------------------------------------------------------

create table public.colaborador_presencas (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.profiles (id) on delete cascade,
  data date not null,
  status text not null
    check (status in ('presente', 'atrasado', 'ausente', 'folga')),
  observacao text,
  registrado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint colaborador_presencas_unico unique (colaborador_id, data)
);

create index colaborador_presencas_data_idx
  on public.colaborador_presencas (data desc);

create index colaborador_presencas_colaborador_id_idx
  on public.colaborador_presencas (colaborador_id);

create trigger colaborador_presencas_set_updated_at
  before update on public.colaborador_presencas
  for each row execute function public.set_updated_at();

alter table public.colaborador_presencas enable row level security;

create policy "Gerente leem presencas"
  on public.colaborador_presencas for select
  to authenticated
  using (public.auth_papel() = 'gerente');

create policy "Gerente criam presencas"
  on public.colaborador_presencas for insert
  to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualizam presencas"
  on public.colaborador_presencas for update
  to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente excluem presencas"
  on public.colaborador_presencas for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.colaborador_presencas to authenticated;

-- ---------------------------------------------------------------------------
-- Faltas (registro formal)
-- ---------------------------------------------------------------------------

create table public.colaborador_faltas (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.profiles (id) on delete cascade,
  data date not null,
  tipo text not null
    check (tipo in ('justificada', 'injustificada')),
  observacao text,
  registrado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index colaborador_faltas_data_idx
  on public.colaborador_faltas (data desc);

create index colaborador_faltas_colaborador_id_idx
  on public.colaborador_faltas (colaborador_id);

create trigger colaborador_faltas_set_updated_at
  before update on public.colaborador_faltas
  for each row execute function public.set_updated_at();

alter table public.colaborador_faltas enable row level security;

create policy "Gerente leem faltas"
  on public.colaborador_faltas for select
  to authenticated
  using (public.auth_papel() = 'gerente');

create policy "Gerente criam faltas"
  on public.colaborador_faltas for insert
  to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualizam faltas"
  on public.colaborador_faltas for update
  to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente excluem faltas"
  on public.colaborador_faltas for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.colaborador_faltas to authenticated;

-- ---------------------------------------------------------------------------
-- Ocorrências
-- ---------------------------------------------------------------------------

create table public.colaborador_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.profiles (id) on delete cascade,
  ocorrido_em date not null default (timezone('America/Sao_Paulo', now()))::date,
  tipo text not null
    check (tipo in ('advertencia', 'elogio', 'acidente', 'atraso_recorrente', 'outro')),
  descricao text not null,
  registrado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index colaborador_ocorrencias_ocorrido_em_idx
  on public.colaborador_ocorrencias (ocorrido_em desc);

create index colaborador_ocorrencias_colaborador_id_idx
  on public.colaborador_ocorrencias (colaborador_id);

alter table public.colaborador_ocorrencias enable row level security;

create policy "Gerente leem ocorrencias"
  on public.colaborador_ocorrencias for select
  to authenticated
  using (public.auth_papel() = 'gerente');

create policy "Gerente criam ocorrencias"
  on public.colaborador_ocorrencias for insert
  to authenticated
  with check (public.auth_papel() = 'gerente');

create policy "Gerente atualizam ocorrencias"
  on public.colaborador_ocorrencias for update
  to authenticated
  using (public.auth_papel() = 'gerente')
  with check (public.auth_papel() = 'gerente');

create policy "Gerente excluem ocorrencias"
  on public.colaborador_ocorrencias for delete
  to authenticated
  using (public.auth_papel() = 'gerente');

grant select, insert, update, delete on public.colaborador_ocorrencias to authenticated;

-- ---------------------------------------------------------------------------
-- Indicadores do período (OS + presença + faltas)
-- ---------------------------------------------------------------------------

create or replace function public.equipe_indicadores(p_inicio date, p_fim date)
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_os_total bigint;
  v_presenca_ok bigint;
  v_presenca_total bigint;
  v_faltas bigint;
  v_taxa numeric;
begin
  if public.auth_papel() <> 'gerente' then
    raise exception 'Apenas gerentes podem ver indicadores da equipe';
  end if;

  if p_fim < p_inicio then
    raise exception 'Período inválido';
  end if;

  select count(*)
  into v_os_total
  from public.ordens_servico o
  where o.status = 'concluida'
    and o.concluida_em is not null
    and (o.concluida_em at time zone 'America/Sao_Paulo')::date >= p_inicio
    and (o.concluida_em at time zone 'America/Sao_Paulo')::date <= p_fim;

  select
    count(*) filter (where p.status in ('presente', 'atrasado')),
    count(*) filter (where p.status in ('presente', 'atrasado', 'ausente'))
  into v_presenca_ok, v_presenca_total
  from public.colaborador_presencas p
  where p.data >= p_inicio
    and p.data <= p_fim;

  select count(*)
  into v_faltas
  from public.colaborador_faltas f
  where f.data >= p_inicio
    and f.data <= p_fim;

  v_taxa := case
    when v_presenca_total > 0 then round((v_presenca_ok::numeric / v_presenca_total::numeric) * 100, 1)
    else null
  end;

  return json_build_object(
    'os_concluidas', v_os_total,
    'taxa_presenca', v_taxa,
    'faltas', v_faltas,
    'por_colaborador', coalesce((
      select json_agg(row_to_json(t) order by t.nome)
      from (
        select
          pr.id,
          pr.nome,
          (
            select count(*)
            from public.ordens_servico o
            where o.status = 'concluida'
              and o.aberto_por = pr.id
              and o.concluida_em is not null
              and (o.concluida_em at time zone 'America/Sao_Paulo')::date >= p_inicio
              and (o.concluida_em at time zone 'America/Sao_Paulo')::date <= p_fim
          )::bigint as os_concluidas,
          (
            select case
              when count(*) filter (where p.status in ('presente', 'atrasado', 'ausente')) = 0 then null
              else round(
                (
                  count(*) filter (where p.status in ('presente', 'atrasado'))::numeric
                  / nullif(count(*) filter (where p.status in ('presente', 'atrasado', 'ausente')), 0)::numeric
                ) * 100,
                1
              )
            end
            from public.colaborador_presencas p
            where p.colaborador_id = pr.id
              and p.data >= p_inicio
              and p.data <= p_fim
          ) as presenca_pct,
          (
            select count(*)
            from public.colaborador_faltas f
            where f.colaborador_id = pr.id
              and f.data >= p_inicio
              and f.data <= p_fim
          )::bigint as faltas
        from public.profiles pr
        order by pr.nome
      ) t
    ), '[]'::json)
  );
end;
$$;

revoke execute on function public.equipe_indicadores(date, date) from public, anon;
grant execute on function public.equipe_indicadores(date, date) to authenticated;
