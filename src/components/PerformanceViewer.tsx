'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PerformanceViewerProps {
  url: string
  onExit: () => void
}

export default function PerformanceViewer({ url, onExit }: PerformanceViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, numPages))
  }, [numPages])

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1))
  }, [])

  // Keyboard navigation
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

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0c0b09] z-50 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1c18] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="p-2 text-[#8a7d6a] hover:text-[#e8d5a3] disabled:text-[#2a2520] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[#5a5344] text-xs font-mono tabular-nums">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={goNext}
            disabled={currentPage >= numPages}
            className="p-2 text-[#8a7d6a] hover:text-[#e8d5a3] disabled:text-[#2a2520] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <span className="text-[#3a3328] text-[10px] font-mono tracking-widest uppercase hidden sm:block">
          Performance Mode
        </span>

        <button
          onClick={onExit}
          className="p-2 text-[#5a5344] hover:text-[#e8d5a3] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Page display */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="text-[#3a3328] text-xs font-mono animate-pulse">
              Loading...
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth > 0 ? pageWidth : undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="max-h-[calc(100vh-56px)] object-contain"
          />
        </Document>
      </div>

      {/* Page dots (mobile) */}
      {numPages > 1 && numPages <= 20 && (
        <div className="flex justify-center gap-1 py-3 shrink-0">
          {Array.from({ length: numPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i + 1 === currentPage ? 'bg-[#c9a84c]' : 'bg-[#2a2520]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
