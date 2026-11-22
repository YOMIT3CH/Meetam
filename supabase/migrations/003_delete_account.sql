-- ============================================================
-- MeetAm Dating App - Migration: User Account Deletion Support
-- ============================================================
-- Run this in your Supabase Project -> SQL Editor.

-- 1. Ensure user delete policy on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON public.profiles FOR DELETE 
      USING (user_id = auth.uid() OR id = auth.uid());
  END IF;
END $$;

-- 2. Ensure user delete policy on wallets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can delete own wallet'
  ) THEN
    CREATE POLICY "Users can delete own wallet"
      ON public.wallets FOR DELETE 
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 3. Atomic RPC to delete the authenticated user's account completely
-- Runs with SECURITY DEFINER so it can delete from auth.users,
-- which automatically cascades to profiles, wallets, unlocked_contacts, transactions, state_alerts.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- 1. Delete associated profile and wallet explicitly
  DELETE FROM public.profiles WHERE user_id = v_uid OR id = v_uid;
  DELETE FROM public.wallets WHERE user_id = v_uid;
  DELETE FROM public.unlocked_contacts WHERE user_id = v_uid OR profile_id = v_uid;
  DELETE FROM public.state_alerts WHERE user_id = v_uid;

  -- 2. Delete user from auth.users (cascades remaining foreign keys)
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  -- Fallback if auth.users deletion has permission issues: deactivate profile
  UPDATE public.profiles 
  SET is_active = FALSE,
      display_name = 'Deleted User',
      full_name = 'Deleted User',
      bio = '',
      about_me = '',
      photo_url = NULL,
      whatsapp_number = NULL,
      snapchat_handle = NULL,
      updated_at = NOW()
  WHERE user_id = v_uid OR id = v_uid;
  
  RETURN jsonb_build_object('ok', true, 'note', 'deactivated');
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
