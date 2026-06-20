'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Document, AnnotationData } from '@/types'
import { togglePublic } from '@/app/library/actions'
import { addToSetlist, createSetlist } from '@/app/library/setlists/actions'
import ThemeToggle from './ThemeToggle'
const ScrollableViewer = dynamic(() => import('./ScrollableViewer'), { ssr: false })
const PerformanceViewer = dynamic(() => import('./PerformanceViewer'), { ssr: false })
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
  Globe,
  Lock,
  Copy,
  Check,
  ListMusic,
  Plus,
} from 'lucide-react'

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
  annotations?: AnnotationData
  setlists?: { id: string; name: string }[]
}

export default function DocumentViewer({
  document,
  viewUrl,
  annotations,
  setlists = [],
}: DocumentViewerProps) {
  const router = useRouter()
  const [performanceMode, setPerformanceMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(document.is_public)
  const [shareToken, setShareToken] = useState(document.share_token)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`
    : null

  const handleTogglePublic = () => {
    startTransition(async () => {
      const result = await togglePublic(document.id)
      setIsPublic(result.is_public)
      setShareToken(result.share_token)
    })
  }

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {performanceMode && viewUrl && (
        <PerformanceViewer
          url={viewUrl}
          annotations={annotations}
          onExit={() => setPerformanceMode(false)}
        />
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
            w-64 h-[100dvh] shrink-0 border-r border-[var(--border-strong)] bg-[var(--bg-base)] flex flex-col
            transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Back nav */}
          <div className="px-5 py-5 border-b border-[var(--border-strong)] flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors"
            >
              <ArrowLeft size={12} />
              Back to library
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Metadata */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="text-[var(--text-primary)] text-sm font-mono leading-relaxed">{document.name}</p>
            </div>

            <div className="space-y-3">
              {document.category && (
                <MetaRow icon={<FolderOpen size={11} />} label="Folder" value={document.category.name} />
              )}
              <MetaRow icon={<Calendar size={11} />} label="Added" value={formatDate(document.created_at)} />
              <MetaRow icon={<HardDrive size={11} />} label="Size" value={formatBytes(document.file_size)} />
              {document.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-2">
                    <Tag size={11} />
                    <span className="text-[9px] font-mono tracking-widest uppercase">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Share section */}
            <div className="pt-1 border-t border-[var(--border-strong)]">
              <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--text-dim)] mb-3">Share</p>

              <button
                onClick={handleTogglePublic}
                disabled={isPending}
                className={`w-full flex items-center justify-between px-3 py-2.5 border text-xs font-mono transition-colors disabled:opacity-50 ${
                  isPublic
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  {isPublic ? 'Public link on' : 'Private'}
                </span>
                <span className={`w-8 h-4 rounded-full transition-colors relative ${isPublic ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isPublic ? 'right-0.5' : 'left-0.5'}`} />
                </span>
              </button>

              {isPublic && shareUrl && (
                <button
                  onClick={handleCopyLink}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] text-xs font-mono transition-colors"
                >
                  {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              )}
            </div>

            {/* Setlists */}
            <AddToSetlist documentId={document.id} setlists={setlists} />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-[var(--border-strong)] space-y-2">
            <div className="pb-1">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setPerformanceMode(true)}
              disabled={!viewUrl}
              className="flex items-center justify-center gap-2 w-full bg-[var(--bg-hover)] hover:bg-[var(--border)] border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-widest uppercase py-2.5 transition-colors disabled:opacity-40"
            >
              <Music2 size={13} />
              Performance Mode
            </button>
            {viewUrl && (
              <a
                href={viewUrl}
                download={`${document.name}.pdf`}
                className="flex items-center justify-center gap-2 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-mono text-xs tracking-widest uppercase py-2.5 transition-colors"
              >
                <Download size={13} />
                Download
              </a>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-[var(--bg-surface)] flex flex-col min-w-0 relative">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-strong)] bg-[var(--bg-base)] shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Menu size={18} />
            </button>
            <p className="text-[var(--text-primary)] text-sm font-mono truncate flex-1">{document.name}</p>
            <button
              onClick={() => setPerformanceMode(true)}
              disabled={!viewUrl}
              className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-mono disabled:opacity-40"
            >
              <Music2 size={13} />
              <span className="hidden sm:inline">Performance</span>
            </button>
          </div>

          <div className="flex-1 relative min-h-0">
            {viewUrl ? (
              <ScrollableViewer
                url={viewUrl}
                documentId={document.id}
                initialAnnotations={annotations}
                canAnnotate
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <FileText size={40} className="text-[var(--border)]" />
                <p className="text-[var(--text-muted)] text-sm font-mono">Could not load PDF</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function AddToSetlist({
  documentId,
  setlists,
}: {
  documentId: string
  setlists: { id: string; name: string }[]
}) {
  const [lists, setLists] = useState(setlists)
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = (setlistId: string) => {
    startTransition(async () => {
      await addToSetlist(setlistId, documentId)
      setAdded(setlistId)
      setTimeout(() => setAdded(null), 1500)
    })
  }

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) {
      setCreating(false)
      return
    }
    startTransition(async () => {
      const id = await createSetlist(name)
      await addToSetlist(id, documentId)
      setLists((prev) => [{ id, name }, ...prev])
      setNewName('')
      setCreating(false)
      setAdded(id)
      setTimeout(() => setAdded(null), 1500)
    })
  }

  return (
    <div className="pt-4 mt-4 border-t border-[var(--border-strong)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-[9px] font-mono tracking-widest uppercase text-[var(--text-dim)] mb-3 hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ListMusic size={11} />
          Setlists
        </span>
        <Plus size={12} className={`transition-transform ${open ? 'rotate-45' : ''}`} />
      </button>

      {open && (
        <div className="space-y-1">
          {lists.map((s) => (
            <button
              key={s.id}
              onClick={() => handleAdd(s.id)}
              disabled={isPending}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors disabled:opacity-50"
            >
              <span className="truncate">{s.name}</span>
              {added === s.id ? (
                <Check size={12} className="text-[var(--accent)] shrink-0" />
              ) : (
                <Plus size={12} className="shrink-0" />
              )}
            </button>
          ))}

          {creating ? (
            <div className="flex gap-1 items-center">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
                placeholder="New setlist..."
                className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text-primary)] text-xs font-mono px-2 py-1 focus:outline-none"
              />
              <button onClick={handleCreate} disabled={isPending} className="text-[var(--accent)] hover:text-[var(--text-primary)] shrink-0">
                <Check size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] text-xs font-mono transition-colors"
            >
              <Plus size={12} />
              New setlist
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-1">
        {icon}
        <span className="text-[9px] font-mono tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-[var(--text-secondary)] text-xs font-mono pl-4">{value}</p>
    </div>
  )
}
