-- Fix RLS policies for newsletters and newsletter_send_logs tables
-- The issue is using current_user instead of auth.uid() in Supabase

-- Drop existing broken policies
DROP POLICY IF EXISTS select_newsletters_policy ON newsletters;
DROP POLICY IF EXISTS update_newsletters_policy ON newsletters;
DROP POLICY IF EXISTS insert_newsletter_send_logs_policy ON newsletter_send_logs;

-- Ensure RLS is enabled
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_send_logs ENABLE ROW LEVEL SECURITY;

-- Create corrected policies using auth.uid() instead of current_user
CREATE POLICY select_newsletters_policy
ON newsletters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
);

CREATE POLICY update_newsletters_policy
ON newsletters
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
);

-- Allow inserts to newsletter_send_logs for authenticated users
CREATE POLICY insert_newsletter_send_logs_policy
ON newsletter_send_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions to Supabase built-in roles (not a role named "auth")
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON newsletters TO anon, authenticated;
GRANT INSERT ON newsletter_send_logs TO anon, authenticated;

-- Optional: If you need INSERT/DELETE on newsletters, add these policies
CREATE POLICY insert_newsletters_policy
ON newsletters
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
);

CREATE POLICY delete_newsletters_policy
ON newsletters
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
);
