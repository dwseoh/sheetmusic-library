'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, X, Maximize, Minimize } from 'lucide-react'
import type { AnnotationData } from '@/types'
import AnnotationOverlay from './AnnotationOverlay'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PADDING = 16 // px each side

interface PerformanceViewerProps {
  url: string
  onExit: () => void
  annotations?: AnnotationData
}

export default function PerformanceViewer({ url, onExit, annotations }: PerformanceViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [pageBox, setPageBox] = useState({ width: 0, height: 0 })
  const [immersive, setImmersive] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)
  const pageWrapRef = useRef<HTMLDivElement>(null)
  const currentStrokes = annotations?.[currentPage] ?? []

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      rootRef.current?.requestFullscreen().catch(() => {})
    }
  }, [])

  // Keep immersive state in sync with the browser's fullscreen status (covers
  // the user pressing Escape or F11 to leave).
  useEffect(() => {
    const onChange = () => setImmersive(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

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

  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, numPages)), [numPages])
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      // While fullscreen, Escape is handled by the browser to leave fullscreen;
      // only exit performance mode when not fullscreen.
      if (e.key === 'Escape' && !document.fullscreenElement) onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onExit, toggleFullscreen])

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

  // Fit page to display area — constrain by height so nothing is clipped
  const pageProps = dims.height > 0 ? { height: dims.height } : {}

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 bg-[var(--bg-deep)] z-50 flex flex-col select-none"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar — hidden in immersive fullscreen so only the page shows */}
      {!immersive && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-strong)] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={goPrev} disabled={currentPage <= 1} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-[var(--border)] transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-[var(--text-muted)] text-xs font-mono tabular-nums">{currentPage} / {numPages}</span>
            <button onClick={goNext} disabled={currentPage >= numPages} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-[var(--border)] transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <span className="text-[var(--text-dim)] text-[10px] font-mono tracking-widest uppercase hidden sm:block">
            Performance Mode
          </span>

          <div className="flex items-center gap-1">
            <button onClick={toggleFullscreen} title="Fullscreen (F)" className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Maximize size={15} />
            </button>
            <button onClick={onExit} title="Exit (Esc)" className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Minimal exit affordance while immersive */}
      {immersive && (
        <button
          onClick={toggleFullscreen}
          title="Exit fullscreen (Esc)"
          className="absolute top-3 right-3 z-10 p-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] opacity-40 hover:opacity-100 transition-opacity"
        >
          <Minimize size={16} />
        </button>
      )}

      {/* Page display — ref here to measure actual available space */}
      <div ref={displayRef} className="flex-1 overflow-hidden flex items-center justify-center">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<span className="text-[var(--text-dim)] text-xs font-mono animate-pulse">Loading...</span>}
        >
          <div ref={pageWrapRef} className="relative">
            <Page
              pageNumber={currentPage}
              {...pageProps}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => {
                if (pageWrapRef.current) {
                  setPageBox({
                    width: pageWrapRef.current.clientWidth,
                    height: pageWrapRef.current.clientHeight,
                  })
                }
              }}
            />
            {pageBox.width > 0 && currentStrokes.length > 0 && (
              <AnnotationOverlay
                width={pageBox.width}
                height={pageBox.height}
                strokes={currentStrokes}
              />
            )}
          </div>
        </Document>
      </div>

      {/* Page dots */}
      {!immersive && numPages > 1 && numPages <= 20 && (
        <div className="flex justify-center gap-1 py-3 shrink-0">
          {Array.from({ length: numPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i + 1 === currentPage ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
