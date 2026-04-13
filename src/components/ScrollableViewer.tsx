'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PADDING = 32 // px each side
// A4 portrait ratio — used to reserve space for unrendered pages
const PAGE_ASPECT_RATIO = 1.414

function LazyPage({ pageNumber, width }: { pageNumber: number; width: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const placeholderHeight = width > 0 ? Math.round(width * PAGE_ASPECT_RATIO) : 200

  return (
    <div ref={ref} className="flex justify-center mb-4">
      {visible && width > 0 ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      ) : (
        <div
          className="bg-[var(--border-subtle)] w-full"
          style={{ height: placeholderHeight }}
        />
      )}
    </div>
  )
}

export default function ScrollableViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.clientWidth - PADDING * 2)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-y-auto bg-[var(--bg-surface)]">
      <div className="py-6" style={{ paddingLeft: PADDING, paddingRight: PADDING }}>
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex items-center justify-center py-20">
              <span className="text-[var(--text-dim)] text-xs font-mono animate-pulse">Loading PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText size={36} className="text-[var(--border)]" />
              <span className="text-[var(--text-muted)] text-sm font-mono">Could not load PDF</span>
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <LazyPage key={i} pageNumber={i + 1} width={pageWidth} />
          ))}
        </Document>
      </div>
    </div>
  )
}
