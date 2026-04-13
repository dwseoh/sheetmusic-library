'use client'

import { useState, useTransition } from 'react'
import { upsertProfile } from '@/app/library/actions'
import { Check } from 'lucide-react'

export default function SettingsForm({ currentUsername }: { currentUsername: string | null }) {
  const [username, setUsername] = useState(currentUsername ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await upsertProfile(username)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-[9px] font-mono tracking-widest uppercase text-[var(--text-dim)] mb-2">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-xs font-mono">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            maxLength={30}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-mono pl-7 pr-4 py-2.5 focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-[var(--text-dim)]"
          />
        </div>
        <p className="text-[var(--text-dim)] text-[10px] font-mono mt-1.5">
          Lowercase letters, numbers, and underscores only.
        </p>
      </div>

      {error && <p className="text-[var(--danger)] text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={!username.trim() || isPending}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-mono text-xs tracking-widest uppercase transition-colors disabled:opacity-40"
      >
        {saved ? (
          <><Check size={12} /> Saved</>
        ) : isPending ? (
          'Saving...'
        ) : (
          currentUsername ? 'Update username' : 'Set username'
        )}
      </button>
    </form>
  )
}
