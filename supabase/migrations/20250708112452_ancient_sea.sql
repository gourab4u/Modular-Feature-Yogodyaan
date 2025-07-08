/*
  # Fix RLS policies and profile handling

  1. Policy Updates
    - Fix infinite recursion in roles table policy
    - Simplify user_roles policies to avoid complex joins
    
  2. Profile Management
    - Add function to automatically create profiles for new users
    - Add trigger to create profiles on user signup
    
  3. Data Consistency
    - Ensure existing users have profiles
*/

-- Drop existing problematic policies on roles table
DROP POLICY IF EXISTS "Super admins manage roles" ON roles;

-- Create simpler, non-recursive policy for roles table
CREATE POLICY "Authenticated users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage roles
CREATE POLICY "Service role manages roles"
  ON roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop and recreate user_roles policies to avoid recursion
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role manages user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;

-- Simple policy for users to read their own roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role manages user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, do nothing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create profiles for existing users who don't have them
INSERT INTO profiles (user_id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;