-- This migration removes the old, broken trigger.
-- The functionality is now handled by a Database Webhook and the create-profile-on-signup Edge Function.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
