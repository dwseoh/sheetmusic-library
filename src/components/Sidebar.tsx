'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import type { Category } from '@/types'
import {
  Library,
  FolderOpen,
  Upload,
  LogOut,
  ChevronRight,
  X,
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
          w-56 shrink-0 flex flex-col border-r border-[#1e1c18] bg-[#0e0d0b] h-screen
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Wordmark */}
        <div className="px-6 pt-8 pb-6 border-b border-[#1e1c18] flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[#e8d5a3] text-xl tracking-tight">Archive</h1>
            <p className="text-[#3a3328] text-[10px] font-mono tracking-widest uppercase mt-0.5">
              Document Library
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#5a5344] hover:text-[#e8d5a3] transition-colors mt-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <NavItem href="/library" icon={<Library size={13} />} label="All Documents" active={isActive('/library')} onClick={onClose} />
          <NavItem href="/library/upload" icon={<Upload size={13} />} label="Upload" active={isActive('/library/upload')} onClick={onClose} />

          {topCategories.length > 0 && (
            <>
              <div className="pt-5 pb-1.5 px-2">
                <span className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase">Folders</span>
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

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#1e1c18]">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[#5a5344] hover:text-[#8a7d6a] hover:bg-[#161410] transition-colors text-xs font-mono"
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
        active ? 'text-[#c9a84c] bg-[#1e1c18]' : 'text-[#8a7d6a] hover:text-[#e8d5a3] hover:bg-[#161410]'
      }`}
    >
      <span className={active ? 'text-[#c9a84c]' : 'text-[#5a5344]'}>{icon}</span>
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
          active ? 'text-[#c9a84c] bg-[#1e1c18]' : 'text-[#8a7d6a] hover:text-[#e8d5a3] hover:bg-[#161410]'
        }`}
        style={{ paddingLeft: `${12 + depth * 12}px`, paddingRight: '12px' }}
      >
        <FolderOpen size={11} className={active ? 'text-[#c9a84c]' : 'text-[#3a3328]'} />
        <span className="truncate">{category.name}</span>
        {children.length > 0 && <ChevronRight size={10} className="ml-auto shrink-0 text-[#3a3328]" />}
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
