'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File
  const name = (formData.get('name') as string) || file.name.replace(/\.pdf$/i, '')
  const categoryId = formData.get('category_id') as string
  const newCategoryName = formData.get('new_category_name') as string
  const tagsRaw = formData.get('tags') as string

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // Create new category if provided
  let resolvedCategoryId: string | null = categoryId || null

  if (newCategoryName?.trim()) {
    const { data: newCat, error: catError } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), created_by: user.id })
      .select('id')
      .single()

    if (catError) throw new Error('Failed to create category')
    resolvedCategoryId = newCat.id
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop()
  const filePath = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) throw new Error('Failed to upload file')

  // Get signed URL (valid 10 years — effectively permanent for private bucket)
  const { data: urlData } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10)

  // Insert document record
  const { error: insertError } = await supabase.from('documents').insert({
    name,
    file_path: filePath,
    storage_url: urlData?.signedUrl ?? null,
    category_id: resolvedCategoryId,
    tags,
    file_size: file.size,
    uploaded_by: user.id,
  })

  if (insertError) throw new Error('Failed to save document')

  redirect('/library')
}
