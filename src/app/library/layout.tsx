import { createClient } from '@/lib/supabase/server'
import LibraryShell from '@/components/LibraryShell'
import type { Category } from '@/types'

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <LibraryShell categories={(categories as Category[]) ?? []}>
      {children}
    </LibraryShell>
  )
}
