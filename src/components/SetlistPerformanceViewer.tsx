'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PADDING = 16

interface Piece {
  name: string
  url: string
}

interface SetlistPerformanceViewerProps {
  pieces: Piece[]
  onExit: () => void
}

export default function SetlistPerformanceViewer({
  pieces,
  onExit,
}: SetlistPerformanceViewerProps) {
  // Page count per piece; null until that PDF has loaded.
  const [counts, setCounts] = useState<(number | null)[]>(() => pieces.map(() => null))
  const [pieceIndex, setPieceIndex] = useState(0)
  const [page, setPage] = useState(1)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const displayRef = useRef<HTMLDivElement>(null)

  // When crossing backwards into a piece whose count isn't known yet, remember
  // that we want its last page and jump there once the count arrives.
  const wantLastOf = useRef<number | null>(null)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const update = () => {
      if (!displayRef.current) return
      const rect = displayRef.current.getBoundingClientRect()
      setDims({
        width: Math.floor(rect.width) - PADDING * 2,
        height: Math.floor(rect.height) - PADDING * 2,
      })
    }
    update()
    const ro = new ResizeObserver(update)
    if (displayRef.current) ro.observe(displayRef.current)
    return () => ro.disconnect()
  }, [])

  const setCount = useCallback((i: number, numPages: number) => {
    setCounts((prev) => {
      if (prev[i] === numPages) return prev
      const next = [...prev]
      next[i] = numPages
      return next
    })
  }, [])

  // Resolve a pending "jump to last page" once the target count is known.
  useEffect(() => {
    const target = wantLastOf.current
    if (target !== null && pieceIndex === target && counts[target]) {
      setPage(counts[target]!)
      wantLastOf.current = null
    }
  }, [counts, pieceIndex])

  const goNext = useCallback(() => {
    const total = counts[pieceIndex]
    if (total && page < total) {
      setPage(page + 1)
    } else if (pieceIndex < pieces.length - 1) {
      setPieceIndex(pieceIndex + 1)
      setPage(1)
    }
  }, [counts, page, pieceIndex, pieces.length])

  const goPrev = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    } else if (pieceIndex > 0) {
      const prev = pieceIndex - 1
      setPieceIndex(prev)
      const c = counts[prev]
      if (c) {
        setPage(c)
      } else {
        setPage(1)
        wantLastOf.current = prev
      }
    }
  }, [counts, page, pieceIndex])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onExit])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const pageProps = dims.height > 0 ? { height: dims.height } : {}

  const allKnown = counts.every((c) => c !== null)
  const totalPages = allKnown ? counts.reduce((a, c) => a + (c ?? 0), 0) : null
  const globalPage = allKnown
    ? counts.slice(0, pieceIndex).reduce((a, c) => a + (c ?? 0), 0) + page
    : null

  const isFirst = pieceIndex === 0 && page <= 1
  const isLast =
    pieceIndex === pieces.length - 1 && !!counts[pieceIndex] && page >= counts[pieceIndex]!

  return (
    <div
      className="fixed inset-0 bg-[var(--bg-deep)] z-50 flex flex-col select-none"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-strong)] shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={goPrev} disabled={isFirst} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-[var(--border)] transition-colors shrink-0">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[var(--text-muted)] text-xs font-mono tabular-nums shrink-0">
            {page} / {counts[pieceIndex] ?? '–'}
          </span>
          <button onClick={goNext} disabled={isLast} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-[var(--border)] transition-colors shrink-0">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="min-w-0 flex flex-col items-center text-center">
          <span className="text-[var(--text-primary)] text-xs font-mono truncate max-w-[40vw]">
            {pieces[pieceIndex]?.name}
          </span>
          <span className="text-[var(--text-dim)] text-[10px] font-mono">
            Piece {pieceIndex + 1} / {pieces.length}
            {totalPages !== null && globalPage !== null ? ` · ${globalPage}/${totalPages}` : ''}
          </span>
        </div>

        <button onClick={onExit} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Page display — all PDFs are mounted so counts resolve and turns flow
          across pieces; only the active piece renders a page. */}
      <div ref={displayRef} className="flex-1 overflow-hidden flex items-center justify-center">
        {pieces.map((piece, i) => (
          <div
            key={i}
            style={{ display: i === pieceIndex ? 'flex' : 'none' }}
            className="items-center justify-center"
          >
            <Document
              file={piece.url}
              onLoadSuccess={({ numPages }) => setCount(i, numPages)}
              loading={
                i === pieceIndex ? (
                  <span className="text-[var(--text-dim)] text-xs font-mono animate-pulse">Loading...</span>
                ) : null
              }
            >
              {i === pieceIndex && (
                <Page
                  pageNumber={page}
                  {...pageProps}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </Document>
          </div>
        ))}
      </div>
    </div>
  )
}
