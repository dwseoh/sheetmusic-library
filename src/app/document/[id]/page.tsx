import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DocumentViewer from '@/components/DocumentViewer'
import type { Document } from '@/types'

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  const document = doc as Document

  const { data: signedData } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 60 * 60)

  return <DocumentViewer document={document} viewUrl={signedData?.signedUrl ?? null} />
}
