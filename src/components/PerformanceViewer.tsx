'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PADDING = 16 // px each side

interface PerformanceViewerProps {
  url: string
  onExit: () => void
}

export default function PerformanceViewer({ url, onExit }: PerformanceViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const displayRef = useRef<HTMLDivElement>(null)

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

  // Fit page to display area — constrain by height so nothing is clipped
  const pageProps = dims.height > 0 ? { height: dims.height } : {}

  return (
    <div
      className="fixed inset-0 bg-[#0c0b09] z-50 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1c18] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} disabled={currentPage <= 1} className="p-2 text-[#8a7d6a] hover:text-[#e8d5a3] disabled:text-[#2a2520] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[#5a5344] text-xs font-mono tabular-nums">{currentPage} / {numPages}</span>
          <button onClick={goNext} disabled={currentPage >= numPages} className="p-2 text-[#8a7d6a] hover:text-[#e8d5a3] disabled:text-[#2a2520] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <span className="text-[#3a3328] text-[10px] font-mono tracking-widest uppercase hidden sm:block">
          Performance Mode
        </span>

        <button onClick={onExit} className="p-2 text-[#5a5344] hover:text-[#e8d5a3] transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Page display — ref here to measure actual available space */}
      <div ref={displayRef} className="flex-1 overflow-hidden flex items-center justify-center">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<span className="text-[#3a3328] text-xs font-mono animate-pulse">Loading...</span>}
        >
          <Page
            pageNumber={currentPage}
            {...pageProps}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {/* Page dots */}
      {numPages > 1 && numPages <= 20 && (
        <div className="flex justify-center gap-1 py-3 shrink-0">
          {Array.from({ length: numPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i + 1 === currentPage ? 'bg-[#c9a84c]' : 'bg-[#2a2520]'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
