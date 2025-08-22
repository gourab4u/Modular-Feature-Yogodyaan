-- 001_create_rls_business_settings.sql
-- Creates is_super_admin() helper and RLS policy for business_settings
-- Run this as a role with DB schema modification privileges (service role or DB owner)

-- Create or replace function to check if the current user is a super_admin using user_roles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    );
END;
$$;

-- Revoke execute permissions from public roles for security
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;

-- Ensure RLS is enabled on the business_settings table
ALTER TABLE IF EXISTS public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin access to business_settings
DROP POLICY IF EXISTS "Super admin can manage business settings" ON public.business_settings;
CREATE POLICY "Super admin can manage business settings" ON public.business_settings
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- (Optional) allow public read-only access via separate policy if you want
-- CREATE POLICY "Anyone can read business settings" ON public.business_settings
-- FOR SELECT
-- TO PUBLIC
-- USING (true);
