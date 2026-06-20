-- Migration: favorites, setlists, annotations
-- Safe to run once on an existing database created from schema.sql.

-- 1. Favorites ---------------------------------------------------------------
alter table public.documents
  add column if not exists is_favorite boolean not null default false;

create index if not exists documents_is_favorite_idx
  on public.documents(is_favorite) where is_favorite = true;

-- 2. Setlists ----------------------------------------------------------------
create table if not exists public.setlists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.setlist_items (
  id          uuid primary key default gen_random_uuid(),
  setlist_id  uuid not null references public.setlists(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (setlist_id, document_id)
);

create index if not exists setlists_created_by_idx on public.setlists(created_by);
create index if not exists setlist_items_setlist_id_idx
  on public.setlist_items(setlist_id, position);

alter table public.setlists       enable row level security;
alter table public.setlist_items  enable row level security;

drop policy if exists "Users manage own setlists" on public.setlists;
create policy "Users manage own setlists"
  on public.setlists for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "Users manage own setlist items" on public.setlist_items;
create policy "Users manage own setlist items"
  on public.setlist_items for all
  using (
    exists (
      select 1 from public.setlists s
      where s.id = setlist_items.setlist_id and s.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.setlists s
      where s.id = setlist_items.setlist_id and s.created_by = auth.uid()
    )
  );

-- 3. Annotations -------------------------------------------------------------
-- One row per document. `data` is { "<pageNumber>": Stroke[] }, where a Stroke is
-- { tool, color, size, points: [[x,y], ...] } with x/y normalised to 0..1.
create table if not exists public.annotations (
  document_id uuid primary key references public.documents(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id) on delete cascade
);

alter table public.annotations enable row level security;

drop policy if exists "Users manage own annotations" on public.annotations;
create policy "Users manage own annotations"
  on public.annotations for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "Annotations readable for public documents" on public.annotations;
create policy "Annotations readable for public documents"
  on public.annotations for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = annotations.document_id and d.is_public = true
    )
  );
