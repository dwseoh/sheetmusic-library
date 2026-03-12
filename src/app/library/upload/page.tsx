import { createClient } from '@/lib/supabase/server'
import UploadForm from './UploadForm'
import type { Category } from '@/types'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="px-8 py-10">
      <UploadForm categories={(categories as Category[]) ?? []} />
    </div>
  )
}
