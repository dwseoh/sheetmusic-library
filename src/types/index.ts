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
  thumbnail_url: string | null
  category_id: string | null
  tags: string[]
  file_size: number
  is_favorite: boolean
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

export interface Setlist {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
  item_count?: number
}

export interface SetlistItem {
  id: string
  setlist_id: string
  document_id: string
  position: number
  created_at: string
  document?: Document
}

// A single freehand mark. Coordinates are normalised to 0..1 of the page box,
// so they scale cleanly across zoom levels and devices.
export type AnnotationTool = 'pen' | 'highlighter'

export interface Stroke {
  tool: AnnotationTool
  color: string
  size: number
  points: [number, number][]
}

// page number (1-based, as a string key) -> strokes on that page
export type AnnotationData = Record<string, Stroke[]>

export interface Annotation {
  document_id: string
  data: AnnotationData
  updated_at: string
  created_by: string
}
