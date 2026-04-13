import Link from 'next/link'
import { Music, FileX } from 'lucide-react'

export default function ShareNotFound() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Branding */}
        <div className="flex items-center gap-2 mb-2">
          <Music size={16} className="text-[var(--accent)]" />
          <span className="font-serif text-[var(--text-primary)] text-lg">Archive</span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 border border-[var(--border-strong)] flex items-center justify-center">
          <FileX size={28} className="text-[var(--text-dim)]" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-[var(--text-primary)] font-mono text-sm">Link unavailable</p>
          <p className="text-[var(--text-muted)] font-mono text-xs leading-relaxed">
            This document is no longer shared or the link has expired.
          </p>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-[var(--border)]" />

        {/* CTA */}
        <Link
          href="/login"
          className="text-[var(--text-dim)] hover:text-[var(--text-muted)] font-mono text-xs transition-colors"
        >
          Sign in to Archive →
        </Link>
      </div>
    </div>
  )
}
