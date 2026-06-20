-- Migration: cached page-1 thumbnails for fast library grids.
-- Stores a signed URL to a small WebP rendered at upload time (or backfilled
-- on first view), so the grid loads images instead of full PDFs.
alter table public.documents
  add column if not exists thumbnail_url text;
