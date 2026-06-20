'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Setlist } from '@/types'
import {
  createSetlist,
  renameSetlist,
  deleteSetlist,
} from '@/app/library/setlists/actions'
import {
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
} from 'lucide-react'

export default function SetlistsView({ setlists }: { setlists: Setlist[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) {
      setCreating(false)
      return
    }
    startTransition(async () => {
      const id = await createSetlist(name)
      setNewName('')
      setCreating(false)
      router.push(`/library/setlists/${id}`)
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--border-strong)] px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
        <div className="flex-1">
          <h2 className="font-serif text-[var(--text-primary)] text-2xl">Setlists</h2>
          <p className="text-[var(--text-muted)] text-xs font-mono mt-0.5">
            {setlists.length} setlist{setlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Plus size={13} />
          New setlist
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-2">
        {creating && (
          <div className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border border-[var(--accent)]">
            <ListMusic size={16} className="text-[var(--accent)] shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setCreating(false)
                  setNewName('')
                }
              }}
              placeholder="Setlist name..."
              className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-mono px-2 py-1 focus:outline-none focus:border-[var(--accent)]"
            />
            <button onClick={handleCreate} disabled={isPending} className="text-[var(--accent)] hover:text-[var(--text-primary)] shrink-0">
              <Check size={15} />
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              <X size={15} />
            </button>
          </div>
        )}

        {setlists.map((setlist) => (
          <SetlistRow key={setlist.id} setlist={setlist} />
        ))}

        {setlists.length === 0 && !creating && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ListMusic size={32} className="text-[var(--border)] mb-4" />
            <p className="text-[var(--text-muted)] text-sm font-mono">No setlists yet</p>
            <p className="text-[var(--text-dim)] text-xs font-mono mt-1">
              Create one to group pieces for a gig or practice session
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SetlistRow({ setlist }: { setlist: Setlist }) {
  const [isPending, startTransition] = useTransition()
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(setlist.name)
  const [deleting, setDeleting] = useState(false)

  const handleRename = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === setlist.name) {
      setRenaming(false)
      setRenameValue(setlist.name)
      return
    }
    startTransition(async () => {
      await renameSetlist(setlist.id, trimmed)
      setRenaming(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSetlist(setlist.id)
    })
  }

  return (
    <div className="relative group flex items-center gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-strong)] hover:border-[var(--accent)] transition-colors">
      {!renaming && !deleting && (
        <Link href={`/library/setlists/${setlist.id}`} className="absolute inset-0 z-10" aria-label={setlist.name} />
      )}

      <ListMusic size={16} className="text-[var(--accent)] shrink-0" />

      <div className="flex-1 min-w-0 relative z-20">
        {renaming ? (
          <div className="flex gap-1 items-center">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setRenaming(false); setRenameValue(setlist.name) }
              }}
              className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text-primary)] text-sm font-mono px-2 py-0.5 focus:outline-none"
            />
            <button onClick={handleRename} disabled={isPending} className="text-[var(--accent)] hover:text-[var(--text-primary)] shrink-0">
              <Check size={14} />
            </button>
            <button onClick={() => { setRenaming(false); setRenameValue(setlist.name) }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : deleting ? (
          <div className="flex items-center gap-3">
            <span className="text-[var(--danger)] text-xs font-mono">Delete &ldquo;{setlist.name}&rdquo;?</span>
            <button onClick={handleDelete} disabled={isPending} className="text-[var(--danger)] text-xs font-mono hover:text-red-300 disabled:opacity-50">
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setDeleting(false)} className="text-[var(--text-muted)] text-xs font-mono hover:text-[var(--text-primary)]">Cancel</button>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-primary)] text-sm font-mono truncate group-hover:text-[var(--accent)] transition-colors">{setlist.name}</p>
            <p className="text-[var(--text-dim)] text-[10px] font-mono mt-0.5">
              {setlist.item_count ?? 0} piece{(setlist.item_count ?? 0) !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      {!renaming && !deleting && (
        <div className="relative z-20 flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); setRenaming(true) }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100"
            title="Rename"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setDeleting(true) }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
          <ChevronRight size={14} className="text-[var(--text-dim)] shrink-0" />
        </div>
      )}
    </div>
  )
}
