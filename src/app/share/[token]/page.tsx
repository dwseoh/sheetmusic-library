import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SharedViewer from '@/components/SharedViewer'
import type { Document, Profile } from '@/types'

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: doc } = await admin
    .from('documents')
    .select('*, category:categories(id, name)')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (!doc) notFound()

  const document = doc as Document

  const { data: profile } = await admin
    .from('profiles')
    .select('username')
    .eq('id', document.uploaded_by)
    .single()

  // The PDF is served through a same-origin proxy route so react-pdf has no CORS
  // issues fetching it, and the document's is_public flag is checked on every request.
  const viewUrl = `/api/share/${token}/pdf`

  return (
    <SharedViewer
      document={document}
      viewUrl={viewUrl}
      sharedBy={(profile as Profile | null)?.username ?? null}
    />
  )
}
