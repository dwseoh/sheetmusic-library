-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Categories (supports nesting via parent_id)
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  parent_id   uuid references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);

-- Documents
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  file_path   text not null,           -- path inside Supabase Storage bucket
  storage_url text,                    -- public/signed URL (cached)
  category_id uuid references public.categories(id) on delete set null,
  tags        text[] not null default '{}',
  file_size   bigint not null default 0,
  created_at  timestamptz not null default now(),
  uploaded_by uuid references auth.users(id) on delete set null
);

-- Indexes
create index documents_category_id_idx on public.documents(category_id);
create index documents_created_at_idx  on public.documents(created_at desc);
create index documents_name_idx        on public.documents using gin(to_tsvector('english', name));

-- Row Level Security: only authenticated users can access
alter table public.categories enable row level security;
alter table public.documents  enable row level security;

create policy "Authenticated users can read categories"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert categories"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update categories"
  on public.categories for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete categories"
  on public.categories for delete
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read documents"
  on public.documents for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert documents"
  on public.documents for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update documents"
  on public.documents for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete documents"
  on public.documents for delete
  using (auth.role() = 'authenticated');

-- Storage bucket (run this in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- Storage RLS
-- create policy "Authenticated users can upload"
--   on storage.objects for insert
--   with check (bucket_id = 'documents' and auth.role() = 'authenticated');

-- create policy "Authenticated users can read"
--   on storage.objects for select
--   using (bucket_id = 'documents' and auth.role() = 'authenticated');
