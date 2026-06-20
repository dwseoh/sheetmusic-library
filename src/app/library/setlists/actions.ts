'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function createSetlist(name: string): Promise<string> {
  const { supabase, user } = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  const { data, error } = await supabase
    .from('setlists')
    .insert({ name: trimmed, created_by: user.id })
    .select('id')
    .single()

  if (error || !data) throw new Error('Failed to create setlist')
  revalidatePath('/library/setlists')
  return data.id
}

export async function renameSetlist(id: string, name: string) {
  const { supabase, user } = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  const { error } = await supabase
    .from('setlists')
    .update({ name: trimmed })
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) throw new Error('Failed to rename setlist')
  revalidatePath('/library/setlists')
  revalidatePath(`/library/setlists/${id}`)
}

export async function deleteSetlist(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('setlists')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) throw new Error('Failed to delete setlist')
  revalidatePath('/library/setlists')
}

export async function addToSetlist(setlistId: string, documentId: string) {
  const { supabase, user } = await requireUser()

  // Ownership of the setlist is enforced by RLS; confirm it exists for a clear error.
  const { data: setlist } = await supabase
    .from('setlists')
    .select('id')
    .eq('id', setlistId)
    .eq('created_by', user.id)
    .single()
  if (!setlist) throw new Error('Setlist not found')

  // Append to the end.
  const { data: last } = await supabase
    .from('setlist_items')
    .select('position')
    .eq('setlist_id', setlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (last?.position ?? -1) + 1

  const { error } = await supabase
    .from('setlist_items')
    .upsert(
      { setlist_id: setlistId, document_id: documentId, position: nextPosition },
      { onConflict: 'setlist_id,document_id', ignoreDuplicates: true }
    )

  if (error) throw new Error('Failed to add to setlist')
  revalidatePath(`/library/setlists/${setlistId}`)
}

export async function removeFromSetlist(itemId: string, setlistId: string) {
  const { supabase } = await requireUser()
  // RLS ensures only the owner's items can be removed.
  const { error } = await supabase.from('setlist_items').delete().eq('id', itemId)
  if (error) throw new Error('Failed to remove from setlist')
  revalidatePath(`/library/setlists/${setlistId}`)
}

// Persist a new ordering. `orderedItemIds` is the full list of item ids in the
// desired order; each is written its index as `position`.
export async function reorderSetlist(setlistId: string, orderedItemIds: string[]) {
  const { supabase } = await requireUser()

  const updates = orderedItemIds.map((id, index) =>
    supabase
      .from('setlist_items')
      .update({ position: index })
      .eq('id', id)
      .eq('setlist_id', setlistId)
  )
  const results = await Promise.all(updates)
  if (results.some((r) => r.error)) throw new Error('Failed to reorder setlist')

  revalidatePath(`/library/setlists/${setlistId}`)
}
