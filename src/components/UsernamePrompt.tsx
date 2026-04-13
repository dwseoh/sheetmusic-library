'use client'

import { useState, useTransition } from 'react'
import { upsertProfile } from '@/app/library/actions'
import { User, X } from 'lucide-react'

export default function UsernamePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (dismissed) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await upsertProfile(username)
        setDismissed(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="w-full max-w-sm bg-[var(--bg-base)] border border-[var(--border-strong)] p-6 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-[var(--accent)]" />
          <h2 className="font-serif text-[var(--text-primary)] text-lg">Set a username</h2>
        </div>
        <p className="text-[var(--text-muted)] text-xs font-mono mb-5 leading-relaxed">
          Your username appears when you share documents publicly. You can always change it in Settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-xs font-mono">@</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              maxLength={30}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-mono pl-7 pr-4 py-2.5 focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-[var(--text-dim)]"
            />
          </div>

          {error && (
            <p className="text-[var(--danger)] text-xs font-mono">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!username.trim() || isPending}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-mono text-xs tracking-widest uppercase py-2.5 transition-colors disabled:opacity-40"
            >
              {isPending ? 'Saving...' : 'Save username'}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="px-4 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-mono text-xs transition-colors"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
