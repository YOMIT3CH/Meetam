-- ============================================================
-- MeetAm Admin Functions & Capabilities
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. RPC: Approve Manual Bank Transfer Top-Up
CREATE OR REPLACE FUNCTION admin_approve_topup(p_transaction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Fetch transaction
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id;
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Transaction not found');
  END IF;

  IF v_tx.status = 'success' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Transaction is already approved');
  END IF;

  -- 1. Update transaction status to success
  UPDATE transactions
  SET status = 'success',
      updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 2. Atomically credit the user's wallet
  INSERT INTO wallets (user_id, credits_balance, updated_at)
  VALUES (v_tx.user_id, v_tx.credits, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET credits_balance = wallets.credits_balance + EXCLUDED.credits_balance,
      updated_at = NOW()
  RETURNING credits_balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'ok', true,
    'new_balance', v_new_balance,
    'credits_added', v_tx.credits
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_approve_topup(UUID) TO authenticated, anon;

-- 2. RPC: Reject Manual Bank Transfer Top-Up
CREATE OR REPLACE FUNCTION admin_reject_topup(p_transaction_id UUID, p_reason TEXT DEFAULT 'Payment not verified')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE transactions
  SET status = 'failed',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rejection_reason', p_reason, 'rejected_at', NOW()::text),
      updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reject_topup(UUID, TEXT) TO authenticated, anon;

-- 3. RPC: Direct Credit Adjustment for any User
CREATE OR REPLACE FUNCTION admin_adjust_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO wallets (user_id, credits_balance, updated_at)
  VALUES (p_user_id, GREATEST(0, p_amount), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET credits_balance = GREATEST(0, wallets.credits_balance + p_amount),
      updated_at = NOW()
  RETURNING credits_balance INTO v_new_balance;

  RETURN jsonb_build_object('ok', true, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_adjust_user_credits(UUID, INTEGER) TO authenticated, anon;

-- 4. RPC: Get All Transactions with User Info
CREATE OR REPLACE FUNCTION admin_get_transactions()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type VARCHAR,
  credits INTEGER,
  amount_ngn NUMERIC,
  status VARCHAR,
  payment_method VARCHAR,
  paystack_ref VARCHAR,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  user_email VARCHAR,
  display_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.type,
    t.credits,
    t.amount_ngn,
    t.status,
    t.payment_method,
    t.paystack_ref,
    t.metadata,
    t.created_at,
    COALESCE(u.email, 'Anonymous')::VARCHAR AS user_email,
    COALESCE(p.display_name, p.full_name, 'Unknown')::VARCHAR AS display_name
  FROM transactions t
  LEFT JOIN auth.users u ON u.id = t.user_id
  LEFT JOIN profiles p ON (p.user_id = t.user_id OR p.id = t.user_id)
  ORDER BY t.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_transactions() TO authenticated, anon;

-- 5. RPC: Get All Wallets for Admin Panel (Bypasses RLS so Admin can see balances)
CREATE OR REPLACE FUNCTION admin_get_wallets()
RETURNS TABLE (
  user_id UUID,
  credits_balance INTEGER,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.user_id,
    w.credits_balance,
    w.updated_at
  FROM wallets w;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_wallets() TO authenticated, anon;

-- 6. RPC: Save Bank Details & Announcement Settings (Bypasses RLS)
CREATE OR REPLACE FUNCTION admin_save_settings(
  p_bank_details JSONB DEFAULT NULL,
  p_announcement_text TEXT DEFAULT NULL,
  p_announcement_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 1. Upsert bank_details in app_settings
  IF p_bank_details IS NOT NULL THEN
    INSERT INTO app_settings (key, value, description, updated_at)
    VALUES ('bank_details', p_bank_details, 'Company bank transfer account details', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW();
  END IF;

  -- 2. Upsert announcement in app_settings as site_announcement (reliable KV store)
  IF p_announcement_text IS NOT NULL THEN
    INSERT INTO app_settings (key, value, description, updated_at)
    VALUES (
      'site_announcement',
      jsonb_build_object(
        'text', p_announcement_text,
        'is_active', COALESCE(p_announcement_active, true),
        'updated_at', NOW()::text
      ),
      'Active broadcast announcement banner',
      NOW()
    )
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW();

    -- 3. Also update or insert in announcements table
    IF EXISTS (SELECT 1 FROM announcements LIMIT 1) THEN
      UPDATE announcements
      SET body = p_announcement_text,
          title = 'Announcement',
          is_active = COALESCE(p_announcement_active, true);
    ELSE
      INSERT INTO announcements (id, title, body, kind, is_active, created_at)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Announcement',
        p_announcement_text,
        'info',
        COALESCE(p_announcement_active, true),
        NOW()
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_save_settings(JSONB, TEXT, BOOLEAN) TO authenticated, anon;

-- 7. Ensure RLS policies allow admin direct writes to app_settings & announcements as fallback
DROP POLICY IF EXISTS "Allow admin modify app_settings" ON app_settings;
CREATE POLICY "Allow admin modify app_settings"
  ON app_settings FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin modify announcements" ON announcements;
CREATE POLICY "Allow admin modify announcements"
  ON announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Add show_photo column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_photo BOOLEAN DEFAULT TRUE;


