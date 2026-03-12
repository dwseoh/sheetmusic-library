'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function ScrollableViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setPageWidth(containerRef.current.clientWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto bg-[#111009]">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center justify-center h-full py-20">
            <span className="text-[#3a3328] text-xs font-mono animate-pulse">Loading PDF...</span>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText size={36} className="text-[#2a2520]" />
            <span className="text-[#5a5344] text-sm font-mono">Could not load PDF</span>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} className="flex justify-center py-2">
            <Page
              pageNumber={i + 1}
              width={pageWidth > 0 ? pageWidth : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
    </div>
  )
}
