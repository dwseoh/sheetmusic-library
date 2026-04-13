'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Document } from '@/types'
import { Music2, Download, FileText, Music } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const ScrollableViewer = dynamic(() => import('./ScrollableViewer'), { ssr: false })
const PerformanceViewer = dynamic(() => import('./PerformanceViewer'), { ssr: false })

interface SharedViewerProps {
  document: Document
  viewUrl: string | null
  sharedBy: string | null
}

export default function SharedViewer({ document, viewUrl, sharedBy }: SharedViewerProps) {
  const [performanceMode, setPerformanceMode] = useState(false)

  return (
    <>
      {performanceMode && viewUrl && (
        <PerformanceViewer url={viewUrl} onExit={() => setPerformanceMode(false)} />
      )}

      <div className="flex flex-col h-[100dvh] bg-[var(--bg-base)]">
        {/* Top bar */}
        <div className="shrink-0 border-b border-[var(--border-strong)] bg-[var(--bg-base)] px-4 sm:px-6 py-3 flex items-center gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <Music size={14} className="text-[var(--accent)]" />
            <span className="font-serif text-[var(--text-primary)] text-base hidden sm:block">Archive</span>
          </div>

          <div className="w-px h-4 bg-[var(--border)] shrink-0" />

          {/* Doc info */}
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-primary)] text-sm font-mono truncate">{document.name}</p>
            {sharedBy && (
              <p className="text-[var(--text-dim)] text-[10px] font-mono mt-0.5">
                shared by <span className="text-[var(--text-muted)]">@{sharedBy}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle compact />
            <button
              onClick={() => setPerformanceMode(true)}
              disabled={!viewUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] text-[10px] font-mono tracking-widest uppercase transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40"
            >
              <Music2 size={11} />
              <span className="hidden sm:inline">Performance</span>
            </button>
            {viewUrl && (
              <a
                href={viewUrl}
                download={`${document.name}.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-[10px] font-mono tracking-widest uppercase transition-colors"
              >
                <Download size={11} />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 min-h-0 relative bg-[var(--bg-surface)]">
          {viewUrl ? (
            <ScrollableViewer url={viewUrl} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <FileText size={40} className="text-[var(--border)]" />
              <p className="text-[var(--text-muted)] text-sm font-mono">Could not load PDF</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
