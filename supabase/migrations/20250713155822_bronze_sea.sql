/*
  # Article Workflow System

  1. New Tables
    - `article_versions` - Track version history for articles
    - `article_notifications` - Handle workflow notifications
    - `article_audit_log` - Track all actions on articles

  2. Schema Updates
    - Update `articles` table with workflow fields
    - Add moderation fields and status tracking

  3. Security
    - Enable RLS on all new tables
    - Add policies for different user roles
    - Ensure proper access control for workflow states

  4. Functions
    - Auto-save functionality
    - Notification triggers
    - Audit logging
*/

-- Update articles table with workflow fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'draft' CHECK (moderation_status IN ('draft', 'pending_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
ADD COLUMN IF NOT EXISTS moderation_notes text,
ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_saved_at timestamptz,
ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;

-- Create article_versions table for version history
CREATE TABLE IF NOT EXISTS article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  preview_text text,
  tags text[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  change_summary text,
  UNIQUE(article_id, version_number)
);

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
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create article_audit_log table
CREATE TABLE IF NOT EXISTS article_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('created', 'updated', 'submitted_for_review', 'approved', 'rejected', 'auto_saved')),
  old_status text,
  new_status text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_versions
CREATE POLICY "Users can view versions of their own articles"
  ON article_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_versions.article_id 
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "Sangha guides can view all article versions"
  ON article_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'sangha_guide'
    )
  );

CREATE POLICY "Users can insert versions of their own articles"
  ON article_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_versions.article_id 
      AND articles.author_id = auth.uid()
    )
  );

-- RLS Policies for article_notifications
CREATE POLICY "Users can view their own notifications"
  ON article_notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON article_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON article_notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- RLS Policies for article_audit_log
CREATE POLICY "Users can view audit logs of their own articles"
  ON article_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_audit_log.article_id 
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "Sangha guides can view all audit logs"
  ON article_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'sangha_guide'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON article_audit_log FOR INSERT
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
      tags,
      created_by,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version_number,
      NEW.title,
      NEW.content,
      NEW.preview_text,
      NEW.tags,
      NEW.author_id,
      CASE 
        WHEN OLD.moderation_status != NEW.moderation_status THEN 'Status changed to ' || NEW.moderation_status
        ELSE 'Content updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log article actions
CREATE OR REPLACE FUNCTION log_article_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO article_audit_log (
      article_id,
      user_id,
      action,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      NEW.author_id,
      'created',
      NEW.moderation_status,
      'Article created'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
      INSERT INTO article_audit_log (
        article_id,
        user_id,
        action,
        old_status,
        new_status,
        notes
      ) VALUES (
        NEW.id,
        COALESCE(NEW.moderated_by, NEW.author_id),
        CASE NEW.moderation_status
          WHEN 'pending_review' THEN 'submitted_for_review'
          WHEN 'approved' THEN 'approved'
          WHEN 'rejected' THEN 'rejected'
          ELSE 'updated'
        END,
        OLD.moderation_status,
        NEW.moderation_status,
        COALESCE(NEW.moderation_notes, 'Status changed')
      );
    END IF;
    
    -- Log auto-saves
    IF OLD.auto_saved_at IS DISTINCT FROM NEW.auto_saved_at THEN
      INSERT INTO article_audit_log (
        article_id,
        user_id,
        action,
        notes
      ) VALUES (
        NEW.id,
        NEW.author_id,
        'auto_saved',
        'Article auto-saved'
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_article_notification()
RETURNS TRIGGER AS $$
DECLARE
  sangha_guide_id uuid;
  notification_title text;
  notification_message text;
BEGIN
  -- Only send notifications on status changes
  IF TG_OP = 'UPDATE' AND OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    
    CASE NEW.moderation_status
      WHEN 'pending_review' THEN
        -- Notify sangha guides about new submission
        FOR sangha_guide_id IN 
          SELECT ur.user_id 
          FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE r.name = 'sangha_guide'
        LOOP
          INSERT INTO article_notifications (
            article_id,
            recipient_id,
            notification_type,
            title,
            message
          ) VALUES (
            NEW.id,
            sangha_guide_id,
            'submitted_for_review',
            'New Article Submitted for Review',
            'Article "' || NEW.title || '" has been submitted for review.'
          );
        END LOOP;
        
      WHEN 'approved' THEN
        -- Notify author about approval
        INSERT INTO article_notifications (
          article_id,
          recipient_id,
          notification_type,
          title,
          message
        ) VALUES (
          NEW.id,
          NEW.author_id,
          'approved',
          'Article Approved',
          'Your article "' || NEW.title || '" has been approved and published.'
        );
        
      WHEN 'rejected' THEN
        -- Notify author about rejection
        INSERT INTO article_notifications (
          article_id,
          recipient_id,
          notification_type,
          title,
          message,
          metadata
        ) VALUES (
          NEW.id,
          NEW.author_id,
          'rejected',
          'Article Rejected',
          'Your article "' || NEW.title || '" has been rejected. Please review the feedback and resubmit.',
          jsonb_build_object('moderation_notes', COALESCE(NEW.moderation_notes, ''))
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS article_version_trigger ON articles;
CREATE TRIGGER article_version_trigger
  AFTER UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_version();

DROP TRIGGER IF EXISTS article_audit_trigger ON articles;
CREATE TRIGGER article_audit_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION log_article_action();

DROP TRIGGER IF EXISTS article_notification_trigger ON articles;
CREATE TRIGGER article_notification_trigger
  AFTER UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION send_article_notification();

-- Update existing articles to have proper moderation status
UPDATE articles 
SET moderation_status = CASE 
  WHEN status = 'published' THEN 'approved'
  WHEN status = 'draft' THEN 'draft'
  ELSE 'draft'
END
WHERE moderation_status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_articles_author_moderation ON articles(author_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_notifications_recipient ON article_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_article_audit_log_article_id ON article_audit_log(article_id);