'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import type { AnnotationData } from '@/types'

export async function renameDocument(id: string, newName: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('documents')
    .update({ name: newName.trim() })
    .eq('id', id)
    .eq('uploaded_by', user.id)

  if (error) throw new Error('Failed to rename document')
  revalidatePath('/library', 'layout')
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('uploaded_by', user.id)
    .single()

  if (fetchError || !doc) throw new Error('Document not found')

  await supabase.storage.from('documents').remove([doc.file_path])

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('uploaded_by', user.id)

  if (error) throw new Error('Failed to delete document')
  revalidatePath('/library', 'layout')
}

export async function togglePublic(
  id: string
): Promise<{ is_public: boolean; share_token: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: doc } = await supabase
    .from('documents')
    .select('is_public, share_token')
    .eq('id', id)
    .eq('uploaded_by', user.id)
    .single()

  if (!doc) throw new Error('Document not found')

  const newPublic = !doc.is_public
  const newToken = newPublic
    ? (doc.share_token ?? randomBytes(8).toString('hex'))
    : null

  const { error } = await supabase
    .from('documents')
    .update({ is_public: newPublic, share_token: newToken })
    .eq('id', id)
    .eq('uploaded_by', user.id)

  if (error) throw new Error('Failed to update sharing')

  revalidatePath(`/document/${id}`)
  return { is_public: newPublic, share_token: newToken }
}

export async function toggleFavorite(id: string): Promise<{ is_favorite: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: doc } = await supabase
    .from('documents')
    .select('is_favorite')
    .eq('id', id)
    .eq('uploaded_by', user.id)
    .single()

  if (!doc) throw new Error('Document not found')

  const newValue = !doc.is_favorite
  const { error } = await supabase
    .from('documents')
    .update({ is_favorite: newValue })
    .eq('id', id)
    .eq('uploaded_by', user.id)

  if (error) throw new Error('Failed to update favorite')

  revalidatePath('/library', 'layout')
  return { is_favorite: newValue }
}

// Backfill a thumbnail for an existing document. The WebP blob is rendered
// client-side and passed through FormData.
export async function saveThumbnail(formData: FormData): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const documentId = formData.get('documentId') as string
  const thumbnail = formData.get('thumbnail')
  if (!documentId || !(thumbnail instanceof File) || thumbnail.size === 0) {
    return null
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, thumbnail_url')
    .eq('id', documentId)
    .eq('uploaded_by', user.id)
    .single()

  if (!doc || doc.thumbnail_url) return doc?.thumbnail_url ?? null // already has one

  const thumbPath = `thumbnails/${doc.file_path}.webp`
  const { error: thumbError } = await supabase.storage
    .from('documents')
    .upload(thumbPath, thumbnail, { contentType: 'image/webp', upsert: true })
  if (thumbError) return null

  const { data: thumbUrlData } = await supabase.storage
    .from('documents')
    .createSignedUrl(thumbPath, 60 * 60 * 24 * 365 * 10)

  const thumbnailUrl = thumbUrlData?.signedUrl ?? null
  if (thumbnailUrl) {
    await supabase
      .from('documents')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', documentId)
      .eq('uploaded_by', user.id)
  }
  return thumbnailUrl
}

export async function saveAnnotations(documentId: string, data: AnnotationData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only the document owner may annotate.
  const { data: doc } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .eq('uploaded_by', user.id)
    .single()

  if (!doc) throw new Error('Document not found')

  const { error } = await supabase.from('annotations').upsert(
    {
      document_id: documentId,
      data,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'document_id' }
  )

  if (error) throw new Error('Failed to save annotations')
}

export async function upsertProfile(username: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const trimmed = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!trimmed || trimmed.length < 2) throw new Error('Username must be at least 2 characters')
  if (trimmed.length > 30) throw new Error('Username must be 30 characters or fewer')

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username: trimmed }, { onConflict: 'id' })

  if (error) {
    if (error.code === '23505') throw new Error('Username already taken')
    throw new Error('Failed to save username')
  }

  revalidatePath('/library', 'layout')
  revalidatePath('/library/settings')
}
