import 'server-only'
import { cache } from 'react'
import { createClient } from './server'
import type { Category } from '@/types'

// `cache()` memoises for the lifetime of a single server request, so when the
// layout and the page both need the user (or categories), the underlying
// Supabase round trip runs once instead of once per component.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const start = performance.now()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (process.env.NODE_ENV === 'development') {
    console.log(`[perf] auth.getUser ${(performance.now() - start).toFixed(0)}ms`)
  }
  return user
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient()
  const start = performance.now()
  const { data } = await supabase.from('categories').select('*').order('name')
  if (process.env.NODE_ENV === 'development') {
    console.log(`[perf] categories query ${(performance.now() - start).toFixed(0)}ms`)
  }
  return (data as Category[]) ?? []
})
