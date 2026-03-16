'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadDocument } from './actions'
import type { Category } from '@/types'
import { Upload, FileText, X, ChevronDown, Plus, FolderPlus } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function UploadForm({ categories }: { categories: Category[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>('existing')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds the 10 MB upload limit')
      return
    }
    setError(null)
    setFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') handleFileSelect(dropped)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('file', file)

    startTransition(async () => {
      try {
        await uploadDocument(formData)
      } catch (err) {
        // Next.js redirect() throws a special error — ignore it
        if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) return
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    })
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10">
        <h2 className="font-serif text-[#e8d5a3] text-3xl">Upload Document</h2>
        <p className="text-[#5a5344] text-xs font-mono mt-1">
          Add a PDF to your archive
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed transition-all duration-200 p-10 flex flex-col items-center justify-center gap-3 text-center ${
            dragging
              ? 'border-[#c9a84c] bg-[#1a170f]'
              : file
              ? 'border-[#c9a84c] bg-[#111009]'
              : 'border-[#2a2520] bg-[#111009] hover:border-[#3a3328]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {file ? (
            <>
              <FileText size={32} className="text-[#c9a84c]" />
              <div>
                <p className="text-[#e8d5a3] text-sm font-mono">{file.name}</p>
                <p className="text-[#5a5344] text-xs font-mono mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="flex items-center gap-1 text-[#5a5344] hover:text-[#e8d5a3] text-xs font-mono mt-1 transition-colors"
              >
                <X size={11} /> Remove
              </button>
            </>
          ) : (
            <>
              <Upload size={28} className="text-[#3a3328]" />
              <div>
                <p className="text-[#8a7d6a] text-sm font-mono">
                  Drop a PDF here
                </p>
                <p className="text-[#3a3328] text-xs font-mono mt-0.5">
                  or click to browse
                </p>
              </div>
            </>
          )}
        </div>

        {/* Document name */}
        <div>
          <label className="block text-[#8a7d6a] text-[10px] font-mono tracking-widest uppercase mb-2">
            Document Name
          </label>
          <input
            name="name"
            type="text"
            placeholder={file ? file.name.replace(/\.pdf$/i, '') : 'Document title'}
            className="w-full bg-[#111009] border border-[#2a2520] text-[#e8d5a3] text-sm font-mono px-4 py-2.5 focus:outline-none focus:border-[#c9a84c] transition-colors placeholder-[#3a3328]"
          />
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#8a7d6a] text-[10px] font-mono tracking-widest uppercase">
              Folder / Category
            </label>
            <button
              type="button"
              onClick={() => setCategoryMode(categoryMode === 'existing' ? 'new' : 'existing')}
              className="flex items-center gap-1 text-[#5a5344] hover:text-[#c9a84c] text-[10px] font-mono transition-colors"
            >
              {categoryMode === 'existing' ? (
                <><FolderPlus size={11} /> Create new</>
              ) : (
                <><ChevronDown size={11} /> Select existing</>
              )}
            </button>
          </div>

          {categoryMode === 'existing' ? (
            <div className="relative">
              <select
                name="category_id"
                className="w-full appearance-none bg-[#111009] border border-[#2a2520] text-[#8a7d6a] text-sm font-mono px-4 py-2.5 pr-8 focus:outline-none focus:border-[#c9a84c] transition-colors cursor-pointer"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5344] pointer-events-none" />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Plus size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5344]" />
                <input
                  name="new_category_name"
                  type="text"
                  placeholder="New folder name"
                  className="w-full bg-[#111009] border border-[#c9a84c] text-[#e8d5a3] text-sm font-mono pl-8 pr-4 py-2.5 focus:outline-none placeholder-[#3a3328]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[#8a7d6a] text-[10px] font-mono tracking-widest uppercase mb-2">
            Tags <span className="text-[#3a3328] normal-case">(comma-separated)</span>
          </label>
          <input
            name="tags"
            type="text"
            placeholder="music, score, piano..."
            className="w-full bg-[#111009] border border-[#2a2520] text-[#e8d5a3] text-sm font-mono px-4 py-2.5 focus:outline-none focus:border-[#c9a84c] transition-colors placeholder-[#3a3328]"
          />
        </div>

        {error && (
          <p className="text-[#c0392b] text-xs font-mono">{error}</p>
        )}

        <button
          type="submit"
          disabled={!file || isPending}
          className="w-full bg-[#c9a84c] hover:bg-[#e8d5a3] disabled:bg-[#2a2520] disabled:text-[#5a5344] text-[#0c0b09] font-mono text-sm tracking-widest uppercase py-3 transition-colors duration-200"
        >
          {isPending ? 'Uploading...' : 'Upload to Archive'}
        </button>
      </form>
    </div>
  )
}
