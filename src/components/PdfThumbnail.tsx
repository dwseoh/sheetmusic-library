'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { FileText } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export default function PdfThumbnail({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden flex items-start justify-center">
      {width > 0 && !failed ? (
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
            onRenderError={() => setFailed(true)}
          />
        </Document>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText size={24} className="text-[#3a3328]" />
        </div>
      )}
    </div>
  )
}
