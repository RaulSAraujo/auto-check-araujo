-- Photos attached to OS as diagnosis evidence (internal only, not on budget PDF).

create table public.ordem_fotos (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  storage_path text not null,
  nome_arquivo text,
  legenda text,
  created_at timestamptz not null default now(),
  constraint ordem_fotos_storage_path_unique unique (storage_path)
);

create index ordem_fotos_ordem_servico_id_idx
  on public.ordem_fotos (ordem_servico_id, created_at);

alter table public.ordem_fotos enable row level security;

create policy "Colaboradores leem fotos da OS"
  on public.ordem_fotos for select to authenticated
  using (true);

create policy "Colaboradores criam fotos da OS"
  on public.ordem_fotos for insert to authenticated
  with check ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

create policy "Colaboradores atualizam fotos da OS"
  on public.ordem_fotos for update to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'))
  with check ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

create policy "Colaboradores excluem fotos da OS"
  on public.ordem_fotos for delete to authenticated
  using ((select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ordem-fotos',
  'ordem-fotos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Colaboradores enviam fotos da OS"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ordem-fotos'
    and (select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico')
  );

create policy "Colaboradores leem fotos da OS"
  on storage.objects for select to authenticated
  using (bucket_id = 'ordem-fotos');

create policy "Colaboradores removem fotos da OS"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ordem-fotos'
    and (select public.auth_papel()) in ('recepcao', 'gerente', 'mecanico')
  );
