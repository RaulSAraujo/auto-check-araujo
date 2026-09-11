-- Remove HR/desempenho da equipe: presença, faltas, ocorrências e indicadores.
-- Colaboradores (profiles + RPCs de papel) permanecem.

drop function if exists public.team_indicators(date, date);
drop function if exists public.equipe_indicadores(date, date);

drop table if exists public.colaborador_ocorrencias;
drop table if exists public.colaborador_faltas;
drop table if exists public.colaborador_presencas;
