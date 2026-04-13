import { createClient } from '@/lib/supabase/server'
import LibraryShell from '@/components/LibraryShell'
import UsernamePrompt from '@/components/UsernamePrompt'
import type { Category, Profile } from '@/types'

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const [{ data: categories }, { data: { user } }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.auth.getUser(),
  ])

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <LibraryShell categories={(categories as Category[]) ?? []}>
      {!profile && <UsernamePrompt />}
      {children}
    </LibraryShell>
  )
}
