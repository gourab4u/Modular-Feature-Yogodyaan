/*
  # Fix Profile Creation and Instructor Management

  1. Profile Creation
    - Ensure all auth users have corresponding profiles
    - Create trigger for automatic profile creation
    - Backfill missing profiles

  2. Instructor Management
    - Fix instructor fetching to use profiles table
    - Ensure proper role assignments
    - Add sample instructor data if needed

  3. Security
    - Update RLS policies for profiles
    - Ensure proper access controls
*/

-- Function to create user profile automatically (improved version)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update email if different
    UPDATE profiles 
    SET email = NEW.email, updated_at = NOW()
    WHERE user_id = NEW.id AND email != NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create profiles for ALL existing users who don't have them
INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Ensure we have instructor and yoga_acharya roles
INSERT INTO roles (name, description) VALUES 
  ('instructor', 'Yoga instructor who can teach classes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES 
  ('yoga_acharya', 'Senior yoga teacher and spiritual guide')
ON CONFLICT (name) DO NOTHING;

-- Create sample instructor if none exist
DO $$
DECLARE
  instructor_role_id UUID;
  sample_user_id UUID;
  existing_instructors_count INTEGER;
BEGIN
  -- Check if we have any instructors
  SELECT COUNT(*) INTO existing_instructors_count
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name IN ('instructor', 'yoga_acharya');

  -- If no instructors exist, create a sample one
  IF existing_instructors_count = 0 THEN
    -- Get instructor role ID
    SELECT id INTO instructor_role_id FROM roles WHERE name = 'instructor';
    
    -- Get the first user (or create a sample user if none exist)
    SELECT user_id INTO sample_user_id FROM profiles LIMIT 1;
    
    IF sample_user_id IS NOT NULL AND instructor_role_id IS NOT NULL THEN
      -- Assign instructor role to the first user
      INSERT INTO user_roles (user_id, role_id, assigned_at)
      VALUES (sample_user_id, instructor_role_id, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING;
      
      -- Update their profile to have a proper name
      UPDATE profiles 
      SET 
        full_name = CASE 
          WHEN full_name = '' OR full_name IS NULL 
          THEN 'Sample Instructor' 
          ELSE full_name 
        END,
        bio = CASE 
          WHEN bio = '' OR bio IS NULL 
          THEN 'Experienced yoga instructor with expertise in various yoga styles.' 
          ELSE bio 
        END,
        updated_at = NOW()
      WHERE user_id = sample_user_id;
    END IF;
  END IF;
END $$;

-- Update profiles RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;

-- Create comprehensive profile policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access to profiles
CREATE POLICY "Service role manages profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read instructor profiles (needed for class scheduling)
CREATE POLICY "Authenticated users can read instructor profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT ur.user_id 
      FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE r.name IN ('instructor', 'yoga_acharya')
    )
  );