import { createClient } from '@/lib/supabase/server'
import SetlistsView from '@/components/SetlistsView'
import type { Setlist } from '@/types'

type SetlistRow = Setlist & { setlist_items: { count: number }[] }

export default async function SetlistsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('setlists')
    .select('*, setlist_items(count)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  const setlists: Setlist[] = ((data as SetlistRow[]) ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    created_at: s.created_at,
    created_by: s.created_by,
    item_count: s.setlist_items?.[0]?.count ?? 0,
  }))

  return <SetlistsView setlists={setlists} />
}
