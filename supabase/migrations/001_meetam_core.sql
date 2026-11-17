-- ============================================================
-- MeetAm Dating App - Complete Core Database Migration
-- ============================================================
-- Run this in your Supabase Project -> SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Announcements
DROP TABLE IF EXISTS announcements CASCADE;
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  kind VARCHAR(50) NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

-- 2. App Settings
DROP TABLE IF EXISTS app_settings CASCADE;
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_app_settings_key UNIQUE (key)
);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Default seeds for app settings
INSERT INTO app_settings (key, value, description)
VALUES 
  ('enable_media_uploads', '{"enable_media_uploads": true}', 'Enable media uploads on profiles'),
  ('enabled_intents', '{"intents": ["serious_relationship", "marriage", "friends", "casual_dating"]}', 'Allowed relationship intents')
ON CONFLICT (key) DO NOTHING;

-- 3. Profiles
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Core dating card fields
  display_name VARCHAR(255),
  age INTEGER,
  gender VARCHAR(50),
  intent VARCHAR(50),
  state VARCHAR(100),
  area VARCHAR(255),
  tribe VARCHAR(100),
  religion VARCHAR(100),
  occupation VARCHAR(255),
  height VARCHAR(50),
  body_type VARCHAR(50),
  about_me TEXT,
  looking_for TEXT,
  whatsapp_number VARCHAR(50),
  snapchat_handle VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  
  -- Extended fields for registration / profile page
  full_name VARCHAR(255),
  date_of_birth DATE,
  orientation VARCHAR(100),
  location_city VARCHAR(255),
  location_state VARCHAR(255),
  bio TEXT,
  interests TEXT[] DEFAULT '{}',
  photo_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_is_featured ON profiles(is_featured, featured_until DESC);

-- Trigger to sync user_id and alias fields (display_name <-> full_name, etc.)
CREATE OR REPLACE FUNCTION public.sync_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If user_id wasn't passed but id matches an auth user, set user_id
  IF NEW.user_id IS NULL AND NEW.id IS NOT NULL THEN
    NEW.user_id := NEW.id;
  END IF;

  -- Sync display_name and full_name
  IF NEW.display_name IS NULL AND NEW.full_name IS NOT NULL THEN
    NEW.display_name := NEW.full_name;
  ELSIF NEW.full_name IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.full_name := NEW.display_name;
  END IF;

  -- Sync about_me and bio
  IF NEW.about_me IS NULL AND NEW.bio IS NOT NULL THEN
    NEW.about_me := NEW.bio;
  ELSIF NEW.bio IS NULL AND NEW.about_me IS NOT NULL THEN
    NEW.bio := NEW.about_me;
  END IF;

  -- Sync state and location_state
  IF NEW.state IS NULL AND NEW.location_state IS NOT NULL THEN
    NEW.state := NEW.location_state;
  ELSIF NEW.location_state IS NULL AND NEW.state IS NOT NULL THEN
    NEW.location_state := NEW.state;
  END IF;

  -- Sync area and location_city
  IF NEW.area IS NULL AND NEW.location_city IS NOT NULL THEN
    NEW.area := NEW.location_city;
  ELSIF NEW.location_city IS NULL AND NEW.area IS NOT NULL THEN
    NEW.location_city := NEW.area;
  END IF;

  -- Calculate age if date_of_birth is present and age is null
  IF NEW.age IS NULL AND NEW.date_of_birth IS NOT NULL THEN
    NEW.age := date_part('year', age(NEW.date_of_birth))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_fields ON profiles;
CREATE TRIGGER trg_sync_profile_fields
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_fields();

-- 4. Wallets
DROP TABLE IF EXISTS wallets CASCADE;
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 5. Unlocked Contacts
DROP TABLE IF EXISTS unlocked_contacts CASCADE;
CREATE TABLE IF NOT EXISTS unlocked_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_unlocked_contacts UNIQUE (user_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_unlocked_contacts_user_id ON unlocked_contacts(user_id);

-- 6. Transactions
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  credits INTEGER NOT NULL,
  amount_ngn NUMERIC(12,2),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  paystack_ref VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created ON transactions(user_id, created_at DESC);

-- 7. State Alerts
DROP TABLE IF EXISTS state_alerts CASCADE;
CREATE TABLE IF NOT EXISTS state_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL DEFAULT '',
  target_state VARCHAR(100),
  target_gender VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_state_alerts_user_id ON state_alerts(user_id);

-- 8. Auto-create wallet on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, credits_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed wallet for existing users
INSERT INTO public.wallets (user_id, credits_balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active announcements"
  ON announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Service role can manage announcements"
  ON announcements FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- App Settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app_settings"
  ON app_settings FOR SELECT USING (true);
CREATE POLICY "Service role can manage app_settings"
  ON app_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE USING (user_id = auth.uid());

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active profiles"
  ON profiles FOR SELECT USING (is_active = TRUE OR user_id = auth.uid() OR id = auth.uid());
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (user_id = auth.uid() OR id = auth.uid());

-- Unlocked Contacts
ALTER TABLE unlocked_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own unlocked contacts"
  ON unlocked_contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own unlocked_contacts"
  ON unlocked_contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own unlocked_contacts"
  ON unlocked_contacts FOR DELETE USING (user_id = auth.uid());

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- State Alerts
ALTER TABLE state_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts"
  ON state_alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own alerts"
  ON state_alerts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own alerts"
  ON state_alerts FOR DELETE USING (user_id = auth.uid());

-- Grant access to authenticated and anon
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON announcements, app_settings, profiles TO anon;

-- ============================================================
-- Atomic RPC: unlock_contact
-- ============================================================
CREATE OR REPLACE FUNCTION unlock_contact(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner      UUID := auth.uid();
  v_latest_at  TIMESTAMPTZ;
  v_balance    INTEGER;
  v_whatsapp   TEXT;
  v_snapchat   TEXT;
  v_has_row    BOOLEAN;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- Already unlocked -> return immediately, no charge or cooldown reset.
  SELECT EXISTS (
    SELECT 1 FROM unlocked_contacts
    WHERE user_id = v_owner AND profile_id = p_profile_id
  ) INTO v_has_row;

  IF v_has_row THEN
    SELECT whatsapp_number, snapchat_handle
    INTO v_whatsapp, v_snapchat
    FROM profiles WHERE id = p_profile_id;
    RETURN jsonb_build_object(
      'ok', true,
      'whatsapp_number', v_whatsapp,
      'snapchat_handle', v_snapchat
    );
  END IF;

  -- Cooldown: most recent unlock within the last 24 hours.
  SELECT unlocked_at INTO v_latest_at
  FROM unlocked_contacts
  WHERE user_id = v_owner
  ORDER BY unlocked_at DESC
  LIMIT 1;

  IF v_latest_at IS NOT NULL AND v_latest_at > (NOW() - INTERVAL '24 hours') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'COOLDOWN_ACTIVE',
      'next_available_at', v_latest_at + INTERVAL '24 hours'
    );
  END IF;

  -- Insufficient credits.
  SELECT credits_balance INTO v_balance FROM wallets WHERE user_id = v_owner;
  IF v_balance IS NULL OR v_balance < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS');
  END IF;

  -- Atomically deduct 1 credit.
  UPDATE wallets
  SET credits_balance = credits_balance - 1, updated_at = NOW()
  WHERE user_id = v_owner;

  -- Record the unlock.
  INSERT INTO unlocked_contacts (user_id, profile_id, unlocked_at)
  VALUES (v_owner, p_profile_id, NOW())
  ON CONFLICT (user_id, profile_id) DO NOTHING;

  -- Return the contact details.
  SELECT whatsapp_number, snapchat_handle
  INTO v_whatsapp, v_snapchat
  FROM profiles WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'ok', true,
    'whatsapp_number', v_whatsapp,
    'snapchat_handle', v_snapchat
  );
END;
$$;

GRANT EXECUTE ON FUNCTION unlock_contact(UUID) TO authenticated;

-- ============================================================
-- Atomic RPC: boost_my_profile
-- ============================================================
CREATE OR REPLACE FUNCTION boost_my_profile(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner   UUID := auth.uid();
  v_balance INTEGER;
  v_own     BOOLEAN;
  v_until   TIMESTAMPTZ := NOW() + INTERVAL '24 hours';
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- Ownership check: check either user_id or id matching v_owner
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id AND (user_id = v_owner OR id = v_owner)
  ) INTO v_own;

  IF NOT v_own THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  -- Balance check.
  SELECT credits_balance INTO v_balance FROM wallets WHERE user_id = v_owner;
  IF v_balance IS NULL OR v_balance < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS');
  END IF;

  -- Deduct 1 credit.
  UPDATE wallets
  SET credits_balance = credits_balance - 1, updated_at = NOW()
  WHERE user_id = v_owner;

  -- Pin the profile for 24 hours.
  UPDATE profiles
  SET is_featured = TRUE,
      featured_until = v_until,
      updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'ok', true,
    'boosted_until', v_until,
    'feature_expires_in_seconds', EXTRACT(EPOCH FROM v_until - NOW())::BIGINT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION boost_my_profile(UUID) TO authenticated;

-- ============================================================
-- Supabase Storage: Receipts Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload receipts'
  ) THEN
    CREATE POLICY "Authenticated users can upload receipts"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view receipts'
  ) THEN
    CREATE POLICY "Public can view receipts"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'receipts');
  END IF;
END $$;
