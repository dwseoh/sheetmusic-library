# Sheet Music Archive

A private document library for storing, browsing, and performing from PDFs. Access the platform on any device. Useful for musicians as it offers an easy way to create setlists, navigate music, and flip pages during practices and performances

## Stack
- Typical stack! Next, TypeScript, Tailwind, and Supabase (for auth/storage).

## Features

- Email/password auth — invite-only access
- Upload PDFs with folder/category organization and tags
- Browse via grid, list, or folder view
- Search and filter
- Inline PDF viewer (all pages, scrollable)
- Performance mode — full-screen, page-by-page with swipe gestures (iPad/mobile) and arrow keys
- Creating publically accessible PDF links

## Set it up for yourself!

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Create a private Storage bucket named `documents` and apply the storage RLS policies (also in the schema file)
4. Copy `.env.example` to `.env.local` and fill in your credentials
5. Add users via Supabase Dashboard → Authentication → Users (unless you want public-enabled access)

```bash
npm install
npm run dev
```

