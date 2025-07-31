-- =============================================
-- Final Consolidated Auth Fix
-- This script correctly creates and enables the new user trigger
-- and the RLS policies for the profiles table.
-- =============================================

-- === FIX 1: Handle New User Trigger ===

-- Create the function that will be triggered on new user signup.
-- This function runs with the permissions of the user who defined it (the superuser).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$;

-- Drop the trigger if it already exists to ensure a clean state.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that calls the function when a new user is added to auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- === FIX 2: Recreate Profile RLS Policies ===

-- Ensure Row Level Security is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the profiles table to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Re-create the essential RLS policies.

-- Policy 1: Allows users to view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allows users to insert their own profile.
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Allows users to update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
