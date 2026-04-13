# Sheet Music Archive

A private document library for storing, browsing, and performing from PDFs.

## Stack

- Next.js, TypeScript, Tailwind CSS
- Supabase — auth, storage, PostgreSQL

## Features

- Email/password auth — invite-only access
- Upload PDFs with folder/category organisation and tags
- Browse via grid, list, or folder view
- Search and filter
- Inline PDF viewer (all pages, scrollable)
- Performance mode — full-screen, page-by-page with swipe gestures (iPad/mobile) and arrow keys
- Creating publically accessible PDF links

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Create a private Storage bucket named `documents` and apply the storage RLS policies (also in the schema file)
4. Copy `.env.example` to `.env.local` and fill in your credentials
5. Add users via Supabase Dashboard → Authentication → Users

```bash
npm install
npm run dev
```

