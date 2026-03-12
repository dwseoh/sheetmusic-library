'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Document, Category } from '@/types'
import {
  Search,
  LayoutGrid,
  List,
  FolderOpen,
  FileText,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'

type ViewMode = 'grid' | 'list' | 'folders'

interface LibraryViewProps {
  documents: Document[]
  categories: Category[]
  currentCategoryId?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function LibraryView({
  documents,
  categories,
  currentCategoryId,
}: LibraryViewProps) {
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>(currentCategoryId ?? '')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = useMemo(() => {
    let docs = [...documents]

    if (search.trim()) {
      const q = search.toLowerCase()
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filterCategory) {
      docs = docs.filter((d) => d.category_id === filterCategory)
    }

    docs.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') return b.file_size - a.file_size
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return docs
  }, [documents, search, filterCategory, sortBy])

  const currentCategory = categories.find((c) => c.id === currentCategoryId)
  const subcategories = categories.filter(
    (c) => c.parent_id === (currentCategoryId ?? null)
  )
  const topCategories = categories.filter((c) => !c.parent_id)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-[#1e1c18] px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h2 className="font-serif text-[#e8d5a3] text-2xl">
            {currentCategory ? currentCategory.name : 'All Documents'}
          </h2>
          <p className="text-[#5a5344] text-xs font-mono mt-0.5">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5344]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-[#111009] border border-[#2a2520] text-[#e8d5a3] text-xs font-mono pl-8 pr-8 py-2 focus:outline-none focus:border-[#c9a84c] transition-colors placeholder-[#3a3328]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a5344] hover:text-[#8a7d6a]"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border transition-colors ${
            filterOpen || filterCategory
              ? 'border-[#c9a84c] text-[#c9a84c]'
              : 'border-[#2a2520] text-[#8a7d6a] hover:border-[#3a3328] hover:text-[#e8d5a3]'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filter
        </button>

        {/* View toggle */}
        <div className="flex border border-[#2a2520]">
          {(['grid', 'list', 'folders'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 transition-colors ${
                view === v
                  ? 'bg-[#1e1c18] text-[#c9a84c]'
                  : 'text-[#5a5344] hover:text-[#8a7d6a]'
              }`}
              title={v.charAt(0).toUpperCase() + v.slice(1)}
            >
              {v === 'grid' && <LayoutGrid size={13} />}
              {v === 'list' && <List size={13} />}
              {v === 'folders' && <FolderOpen size={13} />}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="border-b border-[#1e1c18] px-4 sm:px-8 py-4 flex flex-wrap items-center gap-4 sm:gap-6 bg-[#0e0d0b]">
          <div className="flex items-center gap-3">
            <span className="text-[#5a5344] text-[10px] font-mono tracking-widest uppercase">
              Category
            </span>
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-[#161410] border border-[#2a2520] text-[#8a7d6a] text-xs font-mono px-3 py-1.5 pr-7 focus:outline-none focus:border-[#c9a84c] cursor-pointer"
              >
                <option value="">All</option>
                {topCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a5344] pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#5a5344] text-[10px] font-mono tracking-widest uppercase">
              Sort
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none bg-[#161410] border border-[#2a2520] text-[#8a7d6a] text-xs font-mono px-3 py-1.5 pr-7 focus:outline-none focus:border-[#c9a84c] cursor-pointer"
              >
                <option value="date">Date Added</option>
                <option value="name">Name</option>
                <option value="size">File Size</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a5344] pointer-events-none" />
            </div>
          </div>

          {filterCategory && (
            <button
              onClick={() => setFilterCategory('')}
              className="flex items-center gap-1 text-[#c9a84c] text-xs font-mono hover:text-[#e8d5a3] ml-auto"
            >
              <X size={10} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        {view === 'folders' && (
          <FolderView
            subcategories={subcategories.length > 0 ? subcategories : topCategories}
            categories={categories}
            documents={filtered}
          />
        )}
        {view === 'grid' && <GridView documents={filtered} />}
        {view === 'list' && <ListView documents={filtered} />}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText size={32} className="text-[#2a2520] mb-4" />
            <p className="text-[#5a5344] text-sm font-mono">No documents found</p>
            {search && (
              <p className="text-[#3a3328] text-xs font-mono mt-1">
                Try a different search term
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GridView({ documents }: { documents: Document[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/document/${doc.id}`}
          className="group bg-[#111009] border border-[#1e1c18] hover:border-[#c9a84c] transition-all duration-200 p-4 flex flex-col gap-3"
        >
          {/* PDF icon */}
          <div className="aspect-[3/4] bg-[#161410] flex items-center justify-center border border-[#2a2520] group-hover:border-[#3a3328] transition-colors">
            <FileText size={28} className="text-[#3a3328] group-hover:text-[#5a5344] transition-colors" />
          </div>
          <div className="min-w-0">
            <p className="text-[#e8d5a3] text-xs font-mono truncate leading-relaxed">
              {doc.name}
            </p>
            <p className="text-[#3a3328] text-[10px] font-mono mt-0.5">
              {formatDate(doc.created_at)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ListView({ documents }: { documents: Document[] }) {
  return (
    <div className="border border-[#1e1c18] overflow-x-auto">
      <div className="grid grid-cols-[1fr_140px_100px_80px] px-4 py-2 border-b border-[#1e1c18] bg-[#0e0d0b]">
        {['Name', 'Category', 'Date', 'Size'].map((h) => (
          <span key={h} className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase">
            {h}
          </span>
        ))}
      </div>
      {documents.map((doc, i) => (
        <Link
          key={doc.id}
          href={`/document/${doc.id}`}
          className={`grid grid-cols-[1fr_140px_100px_80px] px-4 py-3 items-center hover:bg-[#111009] transition-colors border-b border-[#1a1814] last:border-0 group ${
            i % 2 === 0 ? '' : 'bg-[#0e0d0b]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={13} className="text-[#3a3328] group-hover:text-[#c9a84c] shrink-0 transition-colors" />
            <span className="text-[#e8d5a3] text-xs font-mono truncate group-hover:text-[#c9a84c] transition-colors">
              {doc.name}
            </span>
          </div>
          <span className="text-[#5a5344] text-xs font-mono truncate">
            {doc.category?.name ?? '—'}
          </span>
          <span className="text-[#5a5344] text-xs font-mono">{formatDate(doc.created_at)}</span>
          <span className="text-[#5a5344] text-xs font-mono">{formatBytes(doc.file_size)}</span>
        </Link>
      ))}
    </div>
  )
}

function FolderView({
  subcategories,
  categories,
  documents,
}: {
  subcategories: Category[]
  categories: Category[]
  documents: Document[]
}) {
  const uncategorized = documents.filter((d) => !d.category_id)

  return (
    <div className="space-y-6">
      {/* Subcategory folders */}
      {subcategories.length > 0 && (
        <div>
          <p className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase mb-3">
            Folders
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {subcategories.map((cat) => {
              const count = documents.filter((d) => d.category_id === cat.id).length
              return (
                <Link
                  key={cat.id}
                  href={`/library/${cat.id}`}
                  className="group flex flex-col gap-2 p-4 bg-[#111009] border border-[#1e1c18] hover:border-[#c9a84c] transition-all duration-200"
                >
                  <FolderOpen
                    size={22}
                    className="text-[#c9a84c] group-hover:text-[#e8d5a3] transition-colors"
                  />
                  <div>
                    <p className="text-[#e8d5a3] text-xs font-mono truncate">{cat.name}</p>
                    <p className="text-[#3a3328] text-[10px] font-mono">
                      {count} file{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Files in current folder */}
      {documents.length > 0 && (
        <div>
          <p className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase mb-3">
            Files
          </p>
          <GridView documents={documents} />
        </div>
      )}

      {uncategorized.length > 0 && subcategories.length > 0 && (
        <div>
          <p className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase mb-3">
            Uncategorized
          </p>
          <GridView documents={uncategorized} />
        </div>
      )}
    </div>
  )
}
