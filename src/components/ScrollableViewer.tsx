'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PADDING = 32 // px each side

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
    <div ref={containerRef} className="absolute inset-0 overflow-y-auto bg-[#111009]">
      <div className="py-6" style={{ paddingLeft: PADDING, paddingRight: PADDING }}>
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex items-center justify-center py-20">
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
            <div key={i} className="flex justify-center mb-4">
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
    </div>
  )
}
