import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Document } from '@/types'
import { ArrowLeft, Download, FileText, Tag, Calendar, HardDrive, FolderOpen } from 'lucide-react'

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

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  const document = doc as Document

  // Generate a fresh signed URL for viewing
  const { data: signedData } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 60 * 60) // 1 hour

  const viewUrl = signedData?.signedUrl

  return (
    <div className="flex h-screen">
      {/* Sidebar panel */}
      <div className="w-64 shrink-0 border-r border-[#1e1c18] bg-[#0e0d0b] flex flex-col">
        {/* Back nav */}
        <div className="px-5 py-5 border-b border-[#1e1c18]">
          <Link
            href={document.category_id ? `/library/${document.category_id}` : '/library'}
            className="flex items-center gap-2 text-[#5a5344] hover:text-[#e8d5a3] text-xs font-mono transition-colors"
          >
            <ArrowLeft size={12} />
            Back to library
          </Link>
        </div>

        {/* Metadata */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-2">
            <FileText size={14} className="text-[#c9a84c] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#e8d5a3] text-sm font-mono leading-relaxed">{document.name}</p>
            </div>
          </div>

          <div className="space-y-3">
            {document.category && (
              <MetaRow
                icon={<FolderOpen size={11} />}
                label="Folder"
                value={document.category.name}
              />
            )}
            <MetaRow
              icon={<Calendar size={11} />}
              label="Added"
              value={formatDate(document.created_at)}
            />
            <MetaRow
              icon={<HardDrive size={11} />}
              label="Size"
              value={formatBytes(document.file_size)}
            />
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
      <div className="flex-1 bg-[#111009]">
        {viewUrl ? (
          <iframe
            src={`${viewUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={document.name}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <FileText size={40} className="text-[#2a2520]" />
            <p className="text-[#5a5344] text-sm font-mono">Could not load PDF</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
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
