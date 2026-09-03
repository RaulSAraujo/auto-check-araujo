-- Perf: ordenação de itens do checklist no índice (evita sort só em memória + seq scan por checklist_id).
-- Substitui o índice simples por composto (checklist_id, ordem) usado no select ordenado.

drop index if exists public.checklist_itens_checklist_id_idx;

create index checklist_itens_checklist_id_ordem_idx
  on public.checklist_itens (checklist_id, ordem);
