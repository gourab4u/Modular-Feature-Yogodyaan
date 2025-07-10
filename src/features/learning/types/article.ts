// In your Article type definition
export interface Article {
  id: string;
  title: string;
  content: string;
  preview_text: string;
  image_url: string;
  video_url: string;
  category: string;
  tags: string[];
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string;
  author?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export interface Rating {
  id: string
  article_id: string
  rating: number
  fingerprint: string
  created_at: string
}

export interface ArticleView {
  id: string
  article_id: string
  fingerprint: string
  viewed_at: string
}

export interface ArticleWithStats extends Article {
  average_rating: number
  total_ratings: number
}