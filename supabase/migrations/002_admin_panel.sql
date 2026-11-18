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
