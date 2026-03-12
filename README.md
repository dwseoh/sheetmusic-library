# Sheet Music Archive

A private document library for storing, browsing, and performing from PDFs.

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase — auth, storage, PostgreSQL

## Features

- Email/password auth — invite-only access
- Upload PDFs with folder/category organisation and tags
- Browse via grid, list, or folder view
- Search and filter
- Inline PDF viewer (all pages, scrollable)
- Performance mode — full-screen, page-by-page with swipe gestures (iPad/mobile) and arrow keys

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Create a private Storage bucket named `documents` and apply the storage RLS policies (also in the schema file)
4. Copy `.env.local.example` to `.env.local` and fill in your credentials
5. Add users via Supabase Dashboard → Authentication → Users

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub, import in [Vercel](https://vercel.com), add the two env vars, and point your DNS with a CNAME to `cname.vercel-dns.com`. Also add your production URL to Supabase → Authentication → URL Configuration.
