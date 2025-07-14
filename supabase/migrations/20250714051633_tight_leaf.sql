/*
  # Add foreign key relationship between articles and profiles

  1. Foreign Key Constraint
    - Add foreign key constraint from articles.author_id to profiles.user_id
    - This will establish the relationship needed for Supabase queries
    - Uses CASCADE on delete to maintain data integrity

  2. Index
    - Add index on articles.author_id for better query performance
*/

-- Add foreign key constraint from articles.author_id to profiles.user_id
ALTER TABLE articles 
ADD CONSTRAINT articles_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(user_id) 
ON DELETE CASCADE;

-- Add index on author_id for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);