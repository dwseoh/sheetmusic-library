import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SetlistDetail from '@/components/SetlistDetail'
import type { Document } from '@/types'

export interface SetlistPiece {
  itemId: string
  documentId: string
  name: string
  url: string | null
}

type ItemRow = {
  id: string
  document_id: string
  position: number
  document: Pick<Document, 'id' | 'name' | 'file_path'> | null
}

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: setlist } = await supabase
    .from('setlists')
    .select('*')
    .eq('id', id)
    .eq('created_by', user!.id)
    .single()

  if (!setlist) notFound()

  const { data: itemRows } = await supabase
    .from('setlist_items')
    .select('id, document_id, position, document:documents(id, name, file_path)')
    .eq('setlist_id', id)
    .order('position', { ascending: true })

  const items = (itemRows as ItemRow[] | null) ?? []

  // Sign every piece's PDF so continuous performance can stream across them.
  const admin = createAdminClient()
  const pieces: SetlistPiece[] = await Promise.all(
    items.map(async (item) => {
      let url: string | null = null
      if (item.document?.file_path) {
        const { data } = await admin.storage
          .from('documents')
          .createSignedUrl(item.document.file_path, 60 * 60)
        url = data?.signedUrl ?? null
      }
      return {
        itemId: item.id,
        documentId: item.document_id,
        name: item.document?.name ?? 'Untitled',
        url,
      }
    })
  )

  return <SetlistDetail setlistId={id} setlistName={setlist.name} pieces={pieces} />
}
