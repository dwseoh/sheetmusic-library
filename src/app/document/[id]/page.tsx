import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import DocumentViewer from '@/components/DocumentViewer'
import type { Document, AnnotationData } from '@/types'

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: doc } = await supabase
    .from('documents')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .single()

  if (!doc || doc.uploaded_by !== user?.id) notFound()

  const document = doc as Document

  const [{ data: signedData }, { data: annotationRow }, { data: setlistRows }] =
    await Promise.all([
      createAdminClient()
        .storage.from('documents')
        .createSignedUrl(document.file_path, 60 * 60),
      supabase.from('annotations').select('data').eq('document_id', id).maybeSingle(),
      supabase
        .from('setlists')
        .select('id, name')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false }),
    ])

  return (
    <DocumentViewer
      document={document}
      viewUrl={signedData?.signedUrl ?? null}
      annotations={(annotationRow?.data as AnnotationData) ?? {}}
      setlists={(setlistRows as { id: string; name: string }[]) ?? []}
    />
  )
}
