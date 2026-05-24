import { createClient } from '@/lib/supabase/server'
import LibraryView from '@/components/LibraryView'
import { notFound } from 'next/navigation'
import type { Document, Category } from '@/types'

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>
}) {
  const { folderId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: categoryData }, { data: documents }, { data: categories }] =
    await Promise.all([
      supabase.from('categories').select('*').eq('id', folderId).single(),
      supabase
        .from('documents')
        .select('*, category:categories(id, name)')
        .eq('category_id', folderId)
        .eq('uploaded_by', user!.id)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])

  if (!categoryData) notFound()

  return (
    <LibraryView
      documents={(documents as Document[]) ?? []}
      categories={(categories as Category[]) ?? []}
      currentCategoryId={folderId}
    />
  )
}
