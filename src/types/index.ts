export interface Category {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  created_by: string
  document_count?: number
  children?: Category[]
}

export interface Document {
  id: string
  name: string
  file_path: string
  storage_url: string | null
  category_id: string | null
  tags: string[]
  file_size: number
  created_at: string
  uploaded_by: string
  category?: Category
  is_public: boolean
  share_token: string | null
}

export interface Profile {
  id: string
  username: string
  created_at: string
}
