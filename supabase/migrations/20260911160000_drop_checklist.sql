-- Remove checklist feature (OS + catalog template + photos).
-- Diagnosis text on OS replaces inspection checklist.
-- Storage objects cannot be deleted via SQL (Storage API only); drop policies
-- and leave the empty-or-orphan `checklist-fotos` bucket for dashboard cleanup.

drop function if exists public.create_order_checklist(uuid);
drop function if exists public.import_checklist_from_catalog(uuid);

drop table if exists public.checklist_item_fotos cascade;
drop table if exists public.checklist_itens cascade;
drop table if exists public.checklists cascade;
drop table if exists public.checklist_template_itens cascade;
drop table if exists public.checklist_templates cascade;

drop policy if exists "Colaboradores enviam fotos de checklist" on storage.objects;
drop policy if exists "Colaboradores leem fotos de checklist" on storage.objects;
drop policy if exists "Colaboradores removem fotos de checklist" on storage.objects;
