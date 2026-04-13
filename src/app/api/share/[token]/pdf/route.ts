import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  // Validate that the document is public and the token matches
  const { data: doc, error: dbError } = await admin
    .from('documents')
    .select('file_path')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (dbError || !doc) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Generate a short-lived signed URL for server-to-server fetch
  const { data: signed, error: storageError } = await admin.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60) // 60 seconds is enough for a server fetch

  if (storageError || !signed?.signedUrl) {
    console.error('[share/pdf] createSignedUrl failed:', storageError, 'path:', doc.file_path)
    return new NextResponse('Storage error', { status: 500 })
  }

  // Fetch from Supabase server-to-server and stream the body directly to the client.
  // cache: 'no-store' opts out of Next.js's extended fetch caching.
  const upstream = await fetch(signed.signedUrl, { cache: 'no-store' })

  if (!upstream.ok) {
    console.error('[share/pdf] upstream fetch failed:', upstream.status, upstream.statusText)
    return new NextResponse('Could not fetch PDF', { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
    },
  })
}
