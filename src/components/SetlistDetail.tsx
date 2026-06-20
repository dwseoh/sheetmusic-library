'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { SetlistPiece } from '@/app/library/setlists/[id]/page'
import { removeFromSetlist, reorderSetlist } from '@/app/library/setlists/actions'
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Music2,
  FileText,
  GripVertical,
} from 'lucide-react'

const SetlistPerformanceViewer = dynamic(
  () => import('./SetlistPerformanceViewer'),
  { ssr: false }
)

export default function SetlistDetail({
  setlistId,
  setlistName,
  pieces: initialPieces,
}: {
  setlistId: string
  setlistName: string
  pieces: SetlistPiece[]
}) {
  const [pieces, setPieces] = useState(initialPieces)
  const [performing, setPerforming] = useState(false)
  const [, startTransition] = useTransition()

  const playable = pieces.filter((p) => p.url)

  const persistOrder = (next: SetlistPiece[]) => {
    setPieces(next)
    startTransition(async () => {
      await reorderSetlist(setlistId, next.map((p) => p.itemId))
    })
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= pieces.length) return
    const next = [...pieces]
    ;[next[index], next[target]] = [next[target], next[index]]
    persistOrder(next)
  }

  const remove = (itemId: string) => {
    setPieces((prev) => prev.filter((p) => p.itemId !== itemId))
    startTransition(async () => {
      await removeFromSetlist(itemId, setlistId)
    })
  }

  return (
    <>
      {performing && playable.length > 0 && (
        <SetlistPerformanceViewer
          pieces={playable.map((p) => ({ name: p.name, url: p.url! }))}
          onExit={() => setPerforming(false)}
        />
      )}

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--border-strong)] px-4 sm:px-8 py-4 sm:py-5">
          <Link
            href="/library/setlists"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors w-fit mb-3"
          >
            <ArrowLeft size={12} />
            All setlists
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-[var(--text-primary)] text-2xl truncate">{setlistName}</h2>
              <p className="text-[var(--text-muted)] text-xs font-mono mt-0.5">
                {pieces.length} piece{pieces.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setPerforming(true)}
              disabled={playable.length === 0}
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-mono text-xs tracking-widest uppercase px-4 py-2.5 transition-colors disabled:opacity-40"
            >
              <Music2 size={14} />
              Perform
            </button>
          </div>
        </div>

        {/* Pieces */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-2">
          {pieces.map((piece, index) => (
            <div
              key={piece.itemId}
              className="group flex items-center gap-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-strong)] hover:border-[var(--accent)] transition-colors"
            >
              <GripVertical size={14} className="text-[var(--text-dim)] shrink-0 hidden sm:block" />
              <span className="text-[var(--text-dim)] text-xs font-mono tabular-nums w-6 shrink-0 text-center">
                {index + 1}
              </span>

              <Link
                href={`/document/${piece.documentId}`}
                className="flex items-center gap-2 flex-1 min-w-0 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                <FileText size={13} className="text-[var(--text-dim)] shrink-0" />
                <span className="text-sm font-mono truncate">{piece.name}</span>
                {!piece.url && (
                  <span className="text-[var(--danger)] text-[10px] font-mono shrink-0">(unavailable)</span>
                )}
              </Link>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === pieces.length - 1}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-20 transition-colors"
                  title="Move down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => remove(piece.itemId)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  title="Remove from setlist"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {pieces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Music2 size={32} className="text-[var(--border)] mb-4" />
              <p className="text-[var(--text-muted)] text-sm font-mono">This setlist is empty</p>
              <p className="text-[var(--text-dim)] text-xs font-mono mt-1">
                Open a document and use &ldquo;Add to setlist&rdquo; to add pieces
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
