'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { FileText } from 'lucide-react'
import { canvasToThumbnailBlob } from '@/lib/pdfThumbnail'
import { saveThumbnail } from '@/app/library/actions'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export default function PdfThumbnail({
  url,
  documentId,
}: {
  url: string
  documentId?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(false)
  const savedThumb = useRef(false)

  // Once page 1 has rendered, cache it as a thumbnail image so future visits
  // skip downloading this PDF entirely (backfill for pre-existing documents).
  const handleRendered = () => {
    if (!documentId || savedThumb.current) return
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    savedThumb.current = true
    void (async () => {
      try {
        const blob = await canvasToThumbnailBlob(canvas)
        if (!blob) return
        const fd = new FormData()
        fd.set('documentId', documentId)
        fd.set('thumbnail', blob, 'thumbnail.webp')
        await saveThumbnail(fd)
      } catch {
        // Non-fatal — the PDF render is already on screen.
      }
    })()
  }

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth)
    }
  }, [])

  // Only download + render the PDF once the card scrolls near the viewport, so
  // the library grid doesn't fetch every PDF up front.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden flex items-start justify-center">
      {visible && width > 0 && !failed ? (
        <Document
          file={url}
          onLoadError={() => setFailed(true)}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={1}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={handleRendered}
            onRenderError={() => setFailed(true)}
          />
        </Document>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText size={24} className="text-[var(--text-dim)]" />
        </div>
      )}
    </div>
  )
}
