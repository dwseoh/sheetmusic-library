import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { Category } from '@/types'

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="flex min-h-screen">
      <Sidebar categories={(categories as Category[]) ?? []} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
