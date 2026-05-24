import { createClient } from '@/lib/supabase/server'
import LibraryView from '@/components/LibraryView'
import type { Document, Category } from '@/types'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: documents }, { data: categories }] = await Promise.all([
    supabase
      .from('documents')
      .select('*, category:categories(id, name)')
      .eq('uploaded_by', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
  ])

  return (
    <LibraryView
      documents={(documents as Document[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  )
}
