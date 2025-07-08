/*
  # Fix infinite recursion in user_roles RLS policies

  1. Security Changes
    - Drop the problematic policy that causes infinite recursion
    - Create new policies that don't reference user_roles table in their conditions
    - Use simpler auth-based policies to avoid circular dependencies

  2. Policy Changes
    - Remove "Super admins manage user_roles" policy
    - Add policies that allow users to read their own roles
    - Add policies for service role to manage all user roles
    - Ensure no policy references user_roles table in its condition
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Super admins manage user_roles" ON user_roles;

-- Create new policies that don't cause recursion
-- Allow users to read their own role assignments
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to manage all user roles (for admin operations)
CREATE POLICY "Service role manages user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all user roles (needed for admin checks)
-- This is safe because it only allows reading, not modification
CREATE POLICY "Authenticated users can read user_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);