import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCategories } from '@/lib/supabase/queries'
import LibraryView from '@/components/LibraryView'
import type { Document } from '@/types'

export default async function LibraryPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const docStart = performance.now()
  const [{ data: documents }, categories] = await Promise.all([
    supabase
      .from('documents')
      .select('*, category:categories(id, name)')
      .eq('uploaded_by', user!.id)
      .order('created_at', { ascending: false }),
    getCategories(),
  ])
  if (process.env.NODE_ENV === 'development') {
    console.log(`[perf] documents query ${(performance.now() - docStart).toFixed(0)}ms`)
  }

  return (
    <LibraryView
      documents={(documents as Document[]) ?? []}
      categories={categories}
    />
  )
}
