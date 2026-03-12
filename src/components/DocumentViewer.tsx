'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Document } from '@/types'
const ScrollableViewer = dynamic(() => import('./ScrollableViewer'), { ssr: false })
import {
  ArrowLeft,
  Download,
  FileText,
  Tag,
  Calendar,
  HardDrive,
  FolderOpen,
  Music2,
  Menu,
  X,
} from 'lucide-react'

const PerformanceViewer = dynamic(() => import('./PerformanceViewer'), { ssr: false })

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface DocumentViewerProps {
  document: Document
  viewUrl: string | null
}

export default function DocumentViewer({ document, viewUrl }: DocumentViewerProps) {
  const [performanceMode, setPerformanceMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {performanceMode && viewUrl && (
        <PerformanceViewer url={viewUrl} onExit={() => setPerformanceMode(false)} />
      )}

      <div className="flex h-[100dvh]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar panel */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-30
            w-64 h-[100dvh] shrink-0 border-r border-[#1e1c18] bg-[#0e0d0b] flex flex-col
            transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Back nav */}
          <div className="px-5 py-5 border-b border-[#1e1c18] flex items-center justify-between">
            <Link
              href={document.category_id ? `/library/${document.category_id}` : '/library'}
              className="flex items-center gap-2 text-[#5a5344] hover:text-[#e8d5a3] text-xs font-mono transition-colors"
            >
              <ArrowLeft size={12} />
              Back to library
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#5a5344] hover:text-[#e8d5a3] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Metadata */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-[#c9a84c] shrink-0 mt-0.5" />
              <p className="text-[#e8d5a3] text-sm font-mono leading-relaxed">{document.name}</p>
            </div>

            <div className="space-y-3">
              {document.category && (
                <MetaRow icon={<FolderOpen size={11} />} label="Folder" value={document.category.name} />
              )}
              <MetaRow icon={<Calendar size={11} />} label="Added" value={formatDate(document.created_at)} />
              <MetaRow icon={<HardDrive size={11} />} label="Size" value={formatBytes(document.file_size)} />
              {document.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[#3a3328] mb-2">
                    <Tag size={11} />
                    <span className="text-[9px] font-mono tracking-widest uppercase">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#161410] border border-[#2a2520] text-[#8a7d6a] text-[10px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-[#1e1c18] space-y-2">
            <button
              onClick={() => setPerformanceMode(true)}
              disabled={!viewUrl}
              className="flex items-center justify-center gap-2 w-full bg-[#1e1c18] hover:bg-[#2a2520] border border-[#c9a84c] text-[#c9a84c] font-mono text-xs tracking-widest uppercase py-2.5 transition-colors disabled:opacity-40"
            >
              <Music2 size={13} />
              Performance Mode
            </button>
            {viewUrl && (
              <a
                href={viewUrl}
                download={`${document.name}.pdf`}
                className="flex items-center justify-center gap-2 w-full bg-[#c9a84c] hover:bg-[#e8d5a3] text-[#0c0b09] font-mono text-xs tracking-widest uppercase py-2.5 transition-colors"
              >
                <Download size={13} />
                Download
              </a>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-[#111009] flex flex-col min-w-0 relative">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1e1c18] bg-[#0e0d0b] shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#8a7d6a] hover:text-[#e8d5a3] transition-colors"
            >
              <Menu size={18} />
            </button>
            <p className="text-[#e8d5a3] text-sm font-mono truncate flex-1">{document.name}</p>
            <button
              onClick={() => setPerformanceMode(true)}
              disabled={!viewUrl}
              className="flex items-center gap-1.5 text-[#c9a84c] text-xs font-mono disabled:opacity-40"
            >
              <Music2 size={13} />
              <span className="hidden sm:inline">Performance</span>
            </button>
          </div>

          <div className="flex-1 relative min-h-0">
            {viewUrl ? (
              <ScrollableViewer url={viewUrl} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <FileText size={40} className="text-[#2a2520]" />
                <p className="text-[#5a5344] text-sm font-mono">Could not load PDF</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[#3a3328] mb-1">
        {icon}
        <span className="text-[9px] font-mono tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-[#8a7d6a] text-xs font-mono pl-4">{value}</p>
    </div>
  )
}
