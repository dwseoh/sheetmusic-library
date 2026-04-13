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

  // Fetch uploader's profile for attribution
  const { data: profile } = await admin
    .from('profiles')
    .select('username')
    .eq('id', document.uploaded_by)
    .single()

  // Generate a signed URL server-side (1-hour expiry)
  const { data: signedData } = await admin.storage
    .from('documents')
    .createSignedUrl(document.file_path, 60 * 60)

  return (
    <SharedViewer
      document={document}
      viewUrl={signedData?.signedUrl ?? null}
      sharedBy={(profile as Profile | null)?.username ?? null}
    />
  )
}
