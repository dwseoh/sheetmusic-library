'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import type { Category } from '@/types'
import ThemeToggle from './ThemeToggle'
import {
  Library,
  FolderOpen,
  Upload,
  LogOut,
  ChevronRight,
  X,
  Settings,
} from 'lucide-react'

interface SidebarProps {
  categories: Category[]
  open: boolean
  onClose: () => void
}

export default function Sidebar({ categories, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href
  const topCategories = categories.filter((c) => !c.parent_id)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30
          w-56 shrink-0 flex flex-col border-r border-[var(--border-strong)] bg-[var(--bg-base)] h-[100dvh]
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Wordmark */}
        <div className="px-6 pt-8 pb-6 border-b border-[var(--border-strong)] flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[var(--text-primary)] text-xl tracking-tight">Archive</h1>
            <p className="text-[var(--text-dim)] text-[10px] font-mono tracking-widest uppercase mt-0.5">
              Document Library
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mt-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <NavItem href="/library" icon={<Library size={13} />} label="All Documents" active={isActive('/library')} onClick={onClose} />
          <NavItem href="/library/upload" icon={<Upload size={13} />} label="Upload" active={isActive('/library/upload')} onClick={onClose} />
          <NavItem href="/library/settings" icon={<Settings size={13} />} label="Settings" active={isActive('/library/settings')} onClick={onClose} />

          {topCategories.length > 0 && (
            <>
              <div className="pt-5 pb-1.5 px-2">
                <span className="text-[var(--text-dim)] text-[9px] font-mono tracking-widest uppercase">Folders</span>
              </div>
              {topCategories.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  allCategories={categories}
                  pathname={pathname}
                  depth={0}
                  onNavigate={onClose}
                />
              ))}
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-[var(--border-strong)] space-y-1">
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors text-xs font-mono"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors ${
        active
          ? 'text-[var(--accent)] bg-[var(--bg-hover)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
      }`}
    >
      <span className={active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>{icon}</span>
      {label}
    </Link>
  )
}

function CategoryItem({
  category,
  allCategories,
  pathname,
  depth,
  onNavigate,
}: {
  category: Category
  allCategories: Category[]
  pathname: string
  depth: number
  onNavigate: () => void
}) {
  const href = `/library/${category.id}`
  const active = pathname === href
  const children = allCategories.filter((c) => c.parent_id === category.id)

  return (
    <div>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-2 py-1.5 text-xs font-mono transition-colors ${
          active
            ? 'text-[var(--accent)] bg-[var(--bg-hover)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
        }`}
        style={{ paddingLeft: `${12 + depth * 12}px`, paddingRight: '12px' }}
      >
        <FolderOpen size={11} className={active ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'} />
        <span className="truncate">{category.name}</span>
        {children.length > 0 && <ChevronRight size={10} className="ml-auto shrink-0 text-[var(--text-dim)]" />}
      </Link>
      {children.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          allCategories={allCategories}
          pathname={pathname}
          depth={depth + 1}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}
