import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCategories } from '@/lib/supabase/queries'
import LibraryShell from '@/components/LibraryShell'
import UsernamePrompt from '@/components/UsernamePrompt'
import type { Profile } from '@/types'

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const [categories, user] = await Promise.all([getCategories(), getCurrentUser()])

  let profile: Profile | null = null
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <LibraryShell categories={categories}>
      {!profile && <UsernamePrompt />}
      {children}
    </LibraryShell>
  )
}
