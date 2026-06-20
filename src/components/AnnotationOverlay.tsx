'use client'

import { useRef, useState, useCallback } from 'react'
import type { Stroke, AnnotationTool } from '@/types'

export type ActiveTool = AnnotationTool | 'eraser'

interface AnnotationOverlayProps {
  width: number
  height: number
  strokes: Stroke[]
  editable?: boolean
  tool?: ActiveTool
  color?: string
  size?: number
  onChange?: (strokes: Stroke[]) => void
}

// Builds an SVG path string from normalised points. With a 0..1 viewBox the
// coordinates are the values themselves.
function toPath(points: [number, number][]): string {
  if (points.length === 0) return ''
  if (points.length === 1) {
    // a dot — draw a tiny segment so it renders with a round cap
    const [x, y] = points[0]
    return `M ${x} ${y} L ${x + 0.0001} ${y}`
  }
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

function strokeOpacity(tool: AnnotationTool): number {
  return tool === 'highlighter' ? 0.38 : 1
}

export default function AnnotationOverlay({
  width,
  height,
  strokes,
  editable = false,
  tool = 'pen',
  color = '#ef4444',
  size = 3,
  onChange,
}: AnnotationOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState<Stroke | null>(null)

  const pointFromEvent = useCallback(
    (e: React.PointerEvent): [number, number] => {
      const rect = svgRef.current!.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
      return [x, y]
    },
    []
  )

  const eraseAt = useCallback(
    (pt: [number, number]) => {
      if (!onChange) return
      const radiusPx = Math.max(10, size * 3)
      const [cx, cy] = pt
      const remaining = strokes.filter((s) => {
        return !s.points.some(([px, py]) => {
          const dx = (px - cx) * width
          const dy = (py - cy) * height
          return Math.sqrt(dx * dx + dy * dy) < radiusPx
        })
      })
      if (remaining.length !== strokes.length) onChange(remaining)
    },
    [strokes, onChange, size, width, height]
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable) return
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const pt = pointFromEvent(e)
    if (tool === 'eraser') {
      eraseAt(pt)
      return
    }
    setDrawing({ tool, color, size, points: [pt] })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editable) return
    const pt = pointFromEvent(e)
    if (tool === 'eraser') {
      if (e.buttons === 1 || e.pressure > 0) eraseAt(pt)
      return
    }
    setDrawing((prev) =>
      prev ? { ...prev, points: [...prev.points, pt] } : prev
    )
  }

  const commit = () => {
    if (!editable) return
    if (drawing && drawing.points.length > 0 && onChange) {
      onChange([...strokes, drawing])
    }
    setDrawing(null)
  }

  const rendered = drawing ? [...strokes, drawing] : strokes

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="absolute inset-0"
      style={{
        pointerEvents: editable ? 'auto' : 'none',
        touchAction: editable ? 'none' : 'auto',
        cursor: editable ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commit}
      onPointerLeave={commit}
    >
      {rendered.map((s, i) => (
        <path
          key={i}
          d={toPath(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.size}
          strokeOpacity={strokeOpacity(s.tool)}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
