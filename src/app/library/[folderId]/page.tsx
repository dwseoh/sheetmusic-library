import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCategories } from '@/lib/supabase/queries'
import LibraryView from '@/components/LibraryView'
import { notFound } from 'next/navigation'
import type { Document } from '@/types'

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>
}) {
  const { folderId } = await params
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [categories, { data: documents }] = await Promise.all([
    getCategories(),
    supabase
      .from('documents')
      .select('*, category:categories(id, name)')
      .eq('category_id', folderId)
      .eq('uploaded_by', user!.id)
      .order('created_at', { ascending: false }),
  ])

  const categoryData = categories.find((c) => c.id === folderId)
  if (!categoryData) notFound()

  return (
    <LibraryView
      documents={(documents as Document[]) ?? []}
      categories={categories}
      currentCategoryId={folderId}
    />
  )
}
