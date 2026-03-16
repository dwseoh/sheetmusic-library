'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Get file path before deleting
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('uploaded_by', user.id)
    .single()

  if (fetchError || !doc) throw new Error('Document not found')

  // Remove from storage
  await supabase.storage.from('documents').remove([doc.file_path])

  // Delete database record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('uploaded_by', user.id)

  if (error) throw new Error('Failed to delete document')
  revalidatePath('/library', 'layout')
}
