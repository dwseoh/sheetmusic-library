'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import type { Category } from '@/types'
import { Menu } from 'lucide-react'

export default function LibraryShell({
  categories,
  children,
}: {
  categories: Category[]
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        categories={categories}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-strong)] bg-[var(--bg-base)] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="font-serif text-[var(--text-primary)] text-lg">Archive</span>
        </div>

        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
