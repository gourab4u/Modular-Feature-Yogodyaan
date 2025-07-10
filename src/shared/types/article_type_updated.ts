export interface Article {
  id: string
  title: string
  content: string
  preview_text: string
  image_url?: string
  video_url?: string
  category: string
  tags?: string[]
  status: 'draft' | 'published'
  author_id: string
  view_count: number
  created_at: string
  updated_at: string
  
  // Moderation fields
  moderation_status: 'pending' | 'approved' | 'rejected'
  moderated_by?: string
  moderated_at?: string
  moderation_notes?: string
  
  // Relations
  profiles?: {
    full_name: string
    email: string
  }
}