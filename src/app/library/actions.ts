'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

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
