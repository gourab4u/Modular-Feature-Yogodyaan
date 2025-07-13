export type ModerationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string;
  preview_text?: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  change_summary?: string;
}

export interface ArticleNotification {
  id: string;
  article_id: string;
  recipient_id: string;
  notification_type: 'submitted_for_review' | 'approved' | 'rejected' | 'auto_saved';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ArticleAuditLog {
  id: string;
  article_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'submitted_for_review' | 'approved' | 'rejected' | 'auto_saved';
  old_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WorkflowArticle {
  id: string;
  title: string;
  content: string;
  preview_text: string;
  image_url?: string;
  video_url?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  moderation_status: ModerationStatus;
  moderated_by?: string;
  moderated_at?: string;
  moderation_notes?: string;
  version_number: number;
  auto_saved_at?: string;
  submitted_for_review_at?: string;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author?: {
    id: string;
    full_name: string;
    email: string;
  };
}