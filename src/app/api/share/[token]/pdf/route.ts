import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: doc } = await admin
    .from('documents')
    .select('file_path')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (!doc) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data, error } = await admin.storage
    .from('documents')
    .download(doc.file_path)

  if (error || !data) {
    return new NextResponse('Could not fetch PDF', { status: 500 })
  }

  const buffer = await data.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
