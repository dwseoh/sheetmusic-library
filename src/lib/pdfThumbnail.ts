'use client'

import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const THUMBNAIL_WIDTH = 420
const WEBP_QUALITY = 0.7

// Render page 1 of a PDF to a small WebP blob, entirely in the browser.
export async function generateThumbnailBlob(
  data: ArrayBuffer | Uint8Array
): Promise<Blob | null> {
  try {
    const pdf = await pdfjs.getDocument({ data }).promise
    const page = await pdf.getPage(1)

    const base = page.getViewport({ scale: 1 })
    const scale = THUMBNAIL_WIDTH / base.width
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY)
    )
  } catch {
    return null
  }
}

// Capture an already-rendered canvas (e.g. from react-pdf) to a WebP blob,
// avoiding a second download/parse when backfilling existing documents.
export async function canvasToThumbnailBlob(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY)
  )
}
