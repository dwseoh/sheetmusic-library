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
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  uploaded_by uuid references auth.users(id) on delete set null
);

-- Indexes
create index documents_category_id_idx on public.documents(category_id);
create index documents_created_at_idx  on public.documents(created_at desc);
create index documents_name_idx        on public.documents using gin(to_tsvector('english', name));
create index documents_is_favorite_idx on public.documents(is_favorite) where is_favorite = true;

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

create policy "Public documents readable by anyone"
  on public.documents for select
  using (is_public = true);

create policy "Users can read own documents"
  on public.documents for select
  using (uploaded_by = auth.uid());

create policy "Users can insert own documents"
  on public.documents for insert
  with check (uploaded_by = auth.uid());

create policy "Users can update own documents"
  on public.documents for update
  using (uploaded_by = auth.uid());

create policy "Users can delete own documents"
  on public.documents for delete
  using (uploaded_by = auth.uid());

-- Setlists ------------------------------------------------------------------
create table public.setlists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id) on delete cascade
);

create table public.setlist_items (
  id          uuid primary key default gen_random_uuid(),
  setlist_id  uuid not null references public.setlists(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (setlist_id, document_id)
);

create index setlists_created_by_idx     on public.setlists(created_by);
create index setlist_items_setlist_id_idx on public.setlist_items(setlist_id, position);

alter table public.setlists      enable row level security;
alter table public.setlist_items enable row level security;

create policy "Users manage own setlists"
  on public.setlists for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Users manage own setlist items"
  on public.setlist_items for all
  using (
    exists (select 1 from public.setlists s
            where s.id = setlist_items.setlist_id and s.created_by = auth.uid())
  )
  with check (
    exists (select 1 from public.setlists s
            where s.id = setlist_items.setlist_id and s.created_by = auth.uid())
  );

-- Annotations ----------------------------------------------------------------
-- One row per document. `data` is { "<pageNumber>": Stroke[] }, where a Stroke is
-- { tool, color, size, points: [[x,y], ...] } with x/y normalised to 0..1.
create table public.annotations (
  document_id uuid primary key references public.documents(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id) on delete cascade
);

alter table public.annotations enable row level security;

create policy "Users manage own annotations"
  on public.annotations for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Annotations readable for public documents"
  on public.annotations for select
  using (
    exists (select 1 from public.documents d
            where d.id = annotations.document_id and d.is_public = true)
  );

-- Storage bucket (run this in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- Storage RLS
-- create policy "Authenticated users can upload"
--   on storage.objects for insert
--   with check (bucket_id = 'documents' and auth.role() = 'authenticated');

-- create policy "Authenticated users can read"
--   on storage.objects for select
--   using (bucket_id = 'documents' and auth.role() = 'authenticated');
