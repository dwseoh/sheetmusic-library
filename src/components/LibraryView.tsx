'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Document, Category } from '@/types'
import { renameDocument, deleteDocument } from '@/app/library/actions'
import {
  Search,
  LayoutGrid,
  List,
  FolderOpen,
  FileText,
  X,
  ChevronDown,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react'

const PdfThumbnail = dynamic(() => import('./PdfThumbnail'), { ssr: false })

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
    <div className="flex flex-col h-full overflow-hidden">
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

function DocumentCard({ doc }: { doc: Document }) {
  const [isPending, startTransition] = useTransition()
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(doc.name)
  const [deleting, setDeleting] = useState(false)

  const handleRename = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === doc.name) {
      setRenaming(false)
      setRenameValue(doc.name)
      return
    }
    startTransition(async () => {
      await renameDocument(doc.id, trimmed)
      setRenaming(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDocument(doc.id)
    })
  }

  return (
    <div
      className={`relative group bg-[#111009] border transition-all duration-200 p-4 flex flex-col gap-3 ${
        deleting ? 'border-red-900/60' : 'border-[#1e1c18] hover:border-[#c9a84c]'
      }`}
    >
      {/* Invisible link covers the card when not in rename/delete mode */}
      {!renaming && !deleting && (
        <Link href={`/document/${doc.id}`} className="absolute inset-0 z-0" aria-label={doc.name} />
      )}

      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-[#161410] border border-[#2a2520] overflow-hidden">
        {doc.storage_url ? (
          <PdfThumbnail url={doc.storage_url} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={28} className="text-[#3a3328]" />
          </div>
        )}
      </div>

      {/* Name / rename input */}
      <div className="min-w-0 relative z-10">
        {renaming ? (
          <div className="flex gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setRenaming(false)
                  setRenameValue(doc.name)
                }
              }}
              className="flex-1 min-w-0 bg-[#161410] border border-[#c9a84c] text-[#e8d5a3] text-xs font-mono px-2 py-1 focus:outline-none"
            />
            <button
              onClick={handleRename}
              disabled={isPending}
              className="text-[#c9a84c] hover:text-[#e8d5a3] shrink-0 transition-colors"
              title="Save"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => {
                setRenaming(false)
                setRenameValue(doc.name)
              }}
              className="text-[#5a5344] hover:text-[#e8d5a3] shrink-0 transition-colors"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : deleting ? (
          <div className="space-y-1.5">
            <p className="text-[#c0392b] text-[10px] font-mono leading-relaxed">
              Delete &ldquo;{doc.name}&rdquo;?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-[#c0392b] text-[10px] font-mono hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleting(false)}
                className="text-[#5a5344] text-[10px] font-mono hover:text-[#e8d5a3] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[#e8d5a3] text-xs font-mono truncate leading-relaxed">
              {doc.name}
            </p>
            <p className="text-[#3a3328] text-[10px] font-mono mt-0.5">
              {formatDate(doc.created_at)}
            </p>
          </>
        )}
      </div>

      {/* Hover action buttons */}
      {!renaming && !deleting && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault()
              setRenaming(true)
            }}
            className="p-1.5 bg-[#1e1c18] border border-[#2a2520] text-[#8a7d6a] hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors"
            title="Rename"
          >
            <Pencil size={10} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              setDeleting(true)
            }}
            className="p-1.5 bg-[#1e1c18] border border-[#2a2520] text-[#8a7d6a] hover:text-[#c0392b] hover:border-red-900/60 transition-colors"
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  )
}

function GridView({ documents }: { documents: Document[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}

function ListDocumentRow({ doc }: { doc: Document }) {
  const [isPending, startTransition] = useTransition()
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(doc.name)
  const [deleting, setDeleting] = useState(false)

  const handleRename = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === doc.name) {
      setRenaming(false)
      setRenameValue(doc.name)
      return
    }
    startTransition(async () => {
      await renameDocument(doc.id, trimmed)
      setRenaming(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDocument(doc.id)
    })
  }

  return (
    <div
      className={`relative grid grid-cols-[1fr_140px_100px_80px_64px] px-4 py-3 items-center hover:bg-[#111009] transition-colors border-b border-[#1a1814] last:border-0 group`}
    >
      {!renaming && !deleting && (
        <Link href={`/document/${doc.id}`} className="absolute inset-0 z-0" aria-label={doc.name} />
      )}

      <div className="flex items-center gap-3 min-w-0 relative z-10">
        <FileText size={13} className="text-[#3a3328] group-hover:text-[#c9a84c] shrink-0 transition-colors" />
        {renaming ? (
          <div className="flex gap-1 flex-1 min-w-0">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setRenaming(false)
                  setRenameValue(doc.name)
                }
              }}
              className="flex-1 min-w-0 bg-[#161410] border border-[#c9a84c] text-[#e8d5a3] text-xs font-mono px-2 py-0.5 focus:outline-none"
            />
            <button onClick={handleRename} disabled={isPending} className="text-[#c9a84c] hover:text-[#e8d5a3] shrink-0">
              <Check size={11} />
            </button>
            <button onClick={() => { setRenaming(false); setRenameValue(doc.name) }} className="text-[#5a5344] hover:text-[#e8d5a3] shrink-0">
              <X size={11} />
            </button>
          </div>
        ) : deleting ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[#c0392b] text-xs font-mono">Delete?</span>
            <button onClick={handleDelete} disabled={isPending} className="text-[#c0392b] text-xs font-mono hover:text-red-300 disabled:opacity-50">
              {isPending ? '...' : 'Yes'}
            </button>
            <button onClick={() => setDeleting(false)} className="text-[#5a5344] text-xs font-mono hover:text-[#e8d5a3]">No</button>
          </div>
        ) : (
          <span className="text-[#e8d5a3] text-xs font-mono truncate group-hover:text-[#c9a84c] transition-colors">
            {doc.name}
          </span>
        )}
      </div>

      <span className="text-[#5a5344] text-xs font-mono truncate">{doc.category?.name ?? '—'}</span>
      <span className="text-[#5a5344] text-xs font-mono">{formatDate(doc.created_at)}</span>
      <span className="text-[#5a5344] text-xs font-mono">{formatBytes(doc.file_size)}</span>

      {/* Action buttons */}
      <div className="relative z-10 flex gap-1 justify-end">
        {!renaming && !deleting && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); setRenaming(true) }}
              className="p-1 text-[#5a5344] hover:text-[#c9a84c] transition-colors"
              title="Rename"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setDeleting(true) }}
              className="p-1 text-[#5a5344] hover:text-[#c0392b] transition-colors"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ListView({ documents }: { documents: Document[] }) {
  return (
    <div className="border border-[#1e1c18] overflow-x-auto">
      <div className="grid grid-cols-[1fr_140px_100px_80px_64px] px-4 py-2 border-b border-[#1e1c18] bg-[#0e0d0b]">
        {['Name', 'Category', 'Date', 'Size', ''].map((h, i) => (
          <span key={i} className="text-[#3a3328] text-[9px] font-mono tracking-widest uppercase">
            {h}
          </span>
        ))}
      </div>
      {documents.map((doc) => (
        <ListDocumentRow key={doc.id} doc={doc} />
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
