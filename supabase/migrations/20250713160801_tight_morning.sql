/*
  # Article Workflow System

  1. New Tables
    - `article_versions` - Track version history of articles
    - `article_notifications` - Notifications for workflow events
    - `article_audit_log` - Audit trail for all article actions

  2. Schema Updates
    - Add workflow fields to existing `articles` table
    - Add moderation status and workflow tracking

  3. Security
    - Enable RLS on all new tables
    - Add policies for users and sangha_guides
    - Ensure proper access control for workflow actions

  4. Functions
    - Auto-versioning triggers
    - Notification triggers
    - Audit logging triggers
*/

-- Add workflow columns to existing articles table
DO $$
BEGIN
  -- Add moderation status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE articles ADD COLUMN moderation_status text DEFAULT 'draft' CHECK (moderation_status IN ('draft', 'pending_review', 'approved', 'rejected'));
  END IF;

  -- Add moderated_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'moderated_by'
  ) THEN
    ALTER TABLE articles ADD COLUMN moderated_by uuid REFERENCES auth.users(id);
  END IF;

  -- Add moderated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'moderated_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN moderated_at timestamptz;
  END IF;

  -- Add moderation_notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'moderation_notes'
  ) THEN
    ALTER TABLE articles ADD COLUMN moderation_notes text;
  END IF;

  -- Add version_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'version_number'
  ) THEN
    ALTER TABLE articles ADD COLUMN version_number integer DEFAULT 1;
  END IF;

  -- Add auto_saved_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'auto_saved_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN auto_saved_at timestamptz;
  END IF;

  -- Add submitted_for_review_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'submitted_for_review_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN submitted_for_review_at timestamptz;
  END IF;
END $$;

-- Create article_versions table
CREATE TABLE IF NOT EXISTS article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  preview_text text,
  image_url text,
  video_url text,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  change_summary text,
  UNIQUE(article_id, version_number)
);

ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Create article_notifications table
CREATE TABLE IF NOT EXISTS article_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  notification_type text NOT NULL CHECK (notification_type IN ('submitted_for_review', 'approved', 'rejected', 'auto_saved')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE article_notifications ENABLE ROW LEVEL SECURITY;

-- Create article_audit_log table
CREATE TABLE IF NOT EXISTS article_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('created', 'updated', 'submitted_for_review', 'approved', 'rejected', 'auto_saved')),
  old_status text,
  new_status text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE article_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_versions
CREATE POLICY "Users can view versions of their own articles"
  ON article_versions
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_versions.article_id 
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "Sangha guides can view all article versions"
  ON article_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'sangha_guide'
    )
  );

CREATE POLICY "System can insert article versions"
  ON article_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for article_notifications
CREATE POLICY "Users can view their own notifications"
  ON article_notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON article_notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON article_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for article_audit_log
CREATE POLICY "Users can view audit logs for their articles"
  ON article_audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_audit_log.article_id 
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "Sangha guides can view all audit logs"
  ON article_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'sangha_guide'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON article_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create article version
CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF TG_OP = 'UPDATE' AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.content IS DISTINCT FROM NEW.content OR
    OLD.preview_text IS DISTINCT FROM NEW.preview_text OR
    OLD.tags IS DISTINCT FROM NEW.tags
  ) THEN
    INSERT INTO article_versions (
      article_id,
      version_number,
      title,
      content,
      preview_text,
      image_url,
      video_url,
      category,
      tags,
      created_by,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version_number,
      NEW.title,
      NEW.content,
      NEW.preview_text,
      NEW.image_url,
      NEW.video_url,
      NEW.category,
      NEW.tags,
      NEW.author_id,
      CASE 
        WHEN OLD.moderation_status != NEW.moderation_status THEN 'Status changed from ' || OLD.moderation_status || ' to ' || NEW.moderation_status
        ELSE 'Content updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_article_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title text;
  notification_message text;
  recipient_id uuid;
BEGIN
  -- Handle status changes
  IF TG_OP = 'UPDATE' AND OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    CASE NEW.moderation_status
      WHEN 'pending_review' THEN
        notification_title := 'Article Submitted for Review';
        notification_message := 'Article "' || NEW.title || '" has been submitted for review.';
        -- Notify sangha guides
        INSERT INTO article_notifications (article_id, recipient_id, notification_type, title, message)
        SELECT NEW.id, ur.user_id, 'submitted_for_review', notification_title, notification_message
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'sangha_guide';
        
      WHEN 'approved' THEN
        notification_title := 'Article Approved';
        notification_message := 'Your article "' || NEW.title || '" has been approved and published.';
        recipient_id := NEW.author_id;
        INSERT INTO article_notifications (article_id, recipient_id, notification_type, title, message)
        VALUES (NEW.id, recipient_id, 'approved', notification_title, notification_message);
        
      WHEN 'rejected' THEN
        notification_title := 'Article Rejected';
        notification_message := 'Your article "' || NEW.title || '" has been rejected. Please review the feedback and resubmit.';
        recipient_id := NEW.author_id;
        INSERT INTO article_notifications (article_id, recipient_id, notification_type, title, message)
        VALUES (NEW.id, recipient_id, 'rejected', notification_title, notification_message);
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_article_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  action_type text;
  old_status_val text;
  new_status_val text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_status_val := NEW.moderation_status;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
      CASE NEW.moderation_status
        WHEN 'pending_review' THEN action_type := 'submitted_for_review';
        WHEN 'approved' THEN action_type := 'approved';
        WHEN 'rejected' THEN action_type := 'rejected';
        ELSE action_type := 'updated';
      END CASE;
      old_status_val := OLD.moderation_status;
      new_status_val := NEW.moderation_status;
    ELSIF NEW.auto_saved_at IS DISTINCT FROM OLD.auto_saved_at THEN
      action_type := 'auto_saved';
      new_status_val := NEW.moderation_status;
    ELSE
      action_type := 'updated';
      new_status_val := NEW.moderation_status;
    END IF;
  END IF;

  INSERT INTO article_audit_log (
    article_id,
    user_id,
    action,
    old_status,
    new_status,
    notes,
    metadata
  ) VALUES (
    NEW.id,
    COALESCE(NEW.moderated_by, NEW.author_id),
    action_type,
    old_status_val,
    new_status_val,
    NEW.moderation_notes,
    jsonb_build_object(
      'version_number', NEW.version_number,
      'title', NEW.title
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS article_version_trigger ON articles;
CREATE TRIGGER article_version_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_version();

DROP TRIGGER IF EXISTS article_notification_trigger ON articles;
CREATE TRIGGER article_notification_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_notification();

DROP TRIGGER IF EXISTS article_audit_log_trigger ON articles;
CREATE TRIGGER article_audit_log_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_audit_log();

-- Update existing articles to have proper moderation status
UPDATE articles 
SET moderation_status = CASE 
  WHEN status = 'published' THEN 'approved'
  ELSE 'draft'
END
WHERE moderation_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_articles_author_moderation ON articles(author_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_notifications_recipient ON article_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_article_audit_log_article_id ON article_audit_log(article_id);