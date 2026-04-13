import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b border-[var(--border-strong)] px-4 sm:px-8 py-4 sm:py-5">
        <h2 className="font-serif text-[var(--text-primary)] text-2xl">Settings</h2>
        <p className="text-[var(--text-dim)] text-xs font-mono mt-0.5">Manage your account</p>
      </div>

      <div className="px-4 sm:px-8 py-8 max-w-md space-y-8">
        {/* Profile section */}
        <section>
          <h3 className="text-[9px] font-mono tracking-widest uppercase text-[var(--text-dim)] mb-4">Profile</h3>
          {user && (
            <div className="mb-3">
              <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--text-dim)] mb-1">Email</p>
              <p className="text-[var(--text-secondary)] text-sm font-mono">{user.email}</p>
            </div>
          )}
          <SettingsForm currentUsername={profile?.username ?? null} />
        </section>
      </div>
    </div>
  )
}
