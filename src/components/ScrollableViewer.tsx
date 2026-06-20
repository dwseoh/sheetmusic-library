'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText, Pencil, Highlighter, Eraser, Undo2, Trash2, Check } from 'lucide-react'
import type { AnnotationData, Stroke } from '@/types'
import AnnotationOverlay, { type ActiveTool } from './AnnotationOverlay'
import { saveAnnotations } from '@/app/library/actions'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PADDING = 32 // px each side
// A4 portrait ratio — used to reserve space for unrendered pages
const PAGE_ASPECT_RATIO = 1.414

const COLORS = ['#ef4444', '#2563eb', '#16a34a', '#eab308', '#111827']
const TOOL_SIZES: Record<ActiveTool, number> = { pen: 3, highlighter: 16, eraser: 14 }

function LazyPage({
  pageNumber,
  width,
  strokes,
  editable,
  tool,
  color,
  size,
  onStrokesChange,
}: {
  pageNumber: number
  width: number
  strokes: Stroke[]
  editable: boolean
  tool: ActiveTool
  color: string
  size: number
  onStrokesChange: (next: Stroke[]) => void
}) {
  const [visible, setVisible] = useState(false)
  const [pageHeight, setPageHeight] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const pageWrapRef = useRef<HTMLDivElement>(null)

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

  // Track the rendered page height so the annotation overlay matches it exactly.
  useEffect(() => {
    const el = pageWrapRef.current
    if (!el) return
    const update = () => setPageHeight(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [visible, width])

  const placeholderHeight = width > 0 ? Math.round(width * PAGE_ASPECT_RATIO) : 200

  return (
    <div ref={ref} className="flex justify-center mb-4">
      {visible && width > 0 ? (
        <div ref={pageWrapRef} className="relative" style={{ width }}>
          <Page
            pageNumber={pageNumber}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
          {pageHeight > 0 && (strokes.length > 0 || editable) && (
            <AnnotationOverlay
              width={width}
              height={pageHeight}
              strokes={strokes}
              editable={editable}
              tool={tool}
              color={color}
              size={size}
              onChange={onStrokesChange}
            />
          )}
        </div>
      ) : (
        <div
          className="bg-[var(--border-subtle)] w-full"
          style={{ height: placeholderHeight }}
        />
      )}
    </div>
  )
}

export default function ScrollableViewer({
  url,
  documentId,
  initialAnnotations,
  canAnnotate = false,
}: {
  url: string
  documentId?: string
  initialAnnotations?: AnnotationData
  canAnnotate?: boolean
}) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [annotations, setAnnotations] = useState<AnnotationData>(initialAnnotations ?? {})
  const [editMode, setEditMode] = useState(false)
  const [tool, setTool] = useState<ActiveTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const lastEditedPage = useRef<number | null>(null)
  const dirty = useRef(false)

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

  // Debounced autosave whenever annotations change after an edit.
  useEffect(() => {
    if (!canAnnotate || !documentId || !dirty.current) return
    setSaveState('saving')
    const t = setTimeout(async () => {
      try {
        await saveAnnotations(documentId, annotations)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 1500)
      } catch {
        setSaveState('idle')
      }
    }, 800)
    return () => clearTimeout(t)
  }, [annotations, canAnnotate, documentId])

  const setPageStrokes = useCallback((page: number, next: Stroke[]) => {
    dirty.current = true
    lastEditedPage.current = page
    setAnnotations((prev) => ({ ...prev, [page]: next }))
  }, [])

  const undo = () => {
    const page = lastEditedPage.current
    if (page === null) return
    const current = annotations[page] ?? []
    if (current.length === 0) return
    setPageStrokes(page, current.slice(0, -1))
  }

  const clearAll = () => {
    dirty.current = true
    setAnnotations({})
  }

  const selectTool = (t: ActiveTool) => {
    setTool(t)
    if (!editMode) setEditMode(true)
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-y-auto bg-[var(--bg-surface)]">
      {canAnnotate && (
        <AnnotationToolbar
          editMode={editMode}
          onToggleEdit={() => setEditMode((v) => !v)}
          tool={tool}
          onSelectTool={selectTool}
          color={color}
          onSelectColor={setColor}
          onUndo={undo}
          onClear={clearAll}
          saveState={saveState}
        />
      )}

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
            <LazyPage
              key={i}
              pageNumber={i + 1}
              width={pageWidth}
              strokes={annotations[i + 1] ?? []}
              editable={editMode}
              tool={tool}
              color={color}
              size={TOOL_SIZES[tool]}
              onStrokesChange={(next) => setPageStrokes(i + 1, next)}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}

function AnnotationToolbar({
  editMode,
  onToggleEdit,
  tool,
  onSelectTool,
  color,
  onSelectColor,
  onUndo,
  onClear,
  saveState,
}: {
  editMode: boolean
  onToggleEdit: () => void
  tool: ActiveTool
  onSelectTool: (t: ActiveTool) => void
  color: string
  onSelectColor: (c: string) => void
  onUndo: () => void
  onClear: () => void
  saveState: 'idle' | 'saving' | 'saved'
}) {
  return (
    <div className="sticky top-3 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 bg-[var(--bg-base)] border border-[var(--border-strong)] px-2 py-1.5 shadow-lg">
        <button
          onClick={onToggleEdit}
          title={editMode ? 'Done annotating' : 'Annotate'}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-mono transition-colors ${
            editMode ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Pencil size={13} />
          <span className="hidden sm:inline">{editMode ? 'Editing' : 'Annotate'}</span>
        </button>

        {editMode && (
          <>
            <div className="w-px h-5 bg-[var(--border-strong)]" />

            <ToolButton active={tool === 'pen'} onClick={() => onSelectTool('pen')} title="Pen">
              <Pencil size={13} />
            </ToolButton>
            <ToolButton active={tool === 'highlighter'} onClick={() => onSelectTool('highlighter')} title="Highlighter">
              <Highlighter size={13} />
            </ToolButton>
            <ToolButton active={tool === 'eraser'} onClick={() => onSelectTool('eraser')} title="Eraser">
              <Eraser size={13} />
            </ToolButton>

            <div className="w-px h-5 bg-[var(--border-strong)]" />

            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onSelectColor(c)}
                  title="Colour"
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    color === c ? 'border-[var(--text-primary)] scale-110' : 'border-[var(--border)]'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="w-px h-5 bg-[var(--border-strong)]" />

            <button onClick={onUndo} title="Undo last stroke" className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Undo2 size={13} />
            </button>
            <button onClick={onClear} title="Clear all annotations" className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
              <Trash2 size={13} />
            </button>
          </>
        )}

        <span className="text-[var(--text-dim)] text-[10px] font-mono w-12 text-right">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-0.5 text-[var(--accent)]">
              <Check size={10} /> Saved
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 transition-colors ${
        active ? 'text-[var(--accent)] bg-[var(--bg-hover)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}
