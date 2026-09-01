-- Fotos de evidência nos itens do checklist

create table public.checklist_item_fotos (
  id uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references public.checklist_itens (id) on delete cascade,
  storage_path text not null,
  nome_arquivo text,
  created_at timestamptz not null default now(),
  constraint checklist_item_fotos_storage_path_unique unique (storage_path)
);

create index checklist_item_fotos_item_id_idx
  on public.checklist_item_fotos (checklist_item_id, created_at);

alter table public.checklist_item_fotos enable row level security;

create policy "Colaboradores leem fotos de checklist"
  on public.checklist_item_fotos for select to authenticated using (true);
create policy "Colaboradores criam fotos de checklist"
  on public.checklist_item_fotos for insert to authenticated with check (true);
create policy "Colaboradores excluem fotos de checklist"
  on public.checklist_item_fotos for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checklist-fotos',
  'checklist-fotos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Colaboradores enviam fotos de checklist"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'checklist-fotos');

create policy "Colaboradores leem fotos de checklist"
  on storage.objects for select to authenticated
  using (bucket_id = 'checklist-fotos');

create policy "Colaboradores removem fotos de checklist"
  on storage.objects for delete to authenticated
  using (bucket_id = 'checklist-fotos');
