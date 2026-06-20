import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCategories } from '@/lib/supabase/queries'
import LibraryView from '@/components/LibraryView'
import type { Document } from '@/types'

export default async function FavoritesPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [{ data: documents }, categories] = await Promise.all([
    supabase
      .from('documents')
      .select('*, category:categories(id, name)')
      .eq('uploaded_by', user!.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false }),
    getCategories(),
  ])

  return (
    <LibraryView
      documents={(documents as Document[]) ?? []}
      categories={categories}
      favoritesOnly
    />
  )
}
