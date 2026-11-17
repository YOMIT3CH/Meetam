-- ============================================================
-- Backend SQL Row-Level Security (RLS) Policies for MeetAm Dating App
-- Database: PostgreSQL
-- ============================================================
-- IMPORTANT: Run this ENTIRE script as a single batch.
-- The script is idempotent - running it multiple times is safe.
-- Each policy has DROP POLICY IF EXISTS before CREATE POLICY.
-- These policies work with the tables in backend_schema_tables.sql
-- ============================================================

-- 1. users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can view all users (idempotent)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Users can update their own profile (idempotent)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 2. profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active profiles (idempotent)
DROP POLICY IF EXISTS "Everyone can view active profiles" ON profiles;
CREATE POLICY "Everyone can view active profiles" ON profiles
  FOR SELECT USING (is_active = TRUE);

-- Policy: Users can view and update their own profile (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR ALL USING (user_id = auth.uid());

-- 3. likes table policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view likes they received (idempotent)
DROP POLICY IF EXISTS "Users can view own likes received" ON likes;
CREATE POLICY "Users can view own likes received" ON likes
  FOR SELECT USING (likee_id = auth.uid());

-- Policy: Users can insert likes they give (idempotent)
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK (liker_id = auth.uid());

-- 4. matches table policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policy: Either user in a match can view the match (idempotent)
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- 5. messages table policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users in a match can view messages (idempotent)
DROP POLICY IF EXISTS "Users in match can view messages" ON messages;
CREATE POLICY "Users in match can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches WHERE id = match_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Policy: Users can insert messages in their matches (idempotent)
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches WHERE id = match_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- 6. credits table policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update their own credits (idempotent)
DROP POLICY IF EXISTS "Users can view own credits" ON credits;
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own credits" ON credits;
CREATE POLICY "Users can update own credits" ON credits
  FOR ALL USING (user_id = auth.uid());

-- 7. notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications (idempotent)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can mark their own notifications as read (idempotent)
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON notifications;
CREATE POLICY "Users can mark own notifications as read" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 8. blocks table policies
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own blocks (idempotent)
DROP POLICY IF EXISTS "Users can view own blocks" ON blocks;
CREATE POLICY "Users can view own blocks" ON blocks
  FOR SELECT USING (blocker_id = auth.uid());

-- Policy: Users can insert blocks (idempotent)
DROP POLICY IF EXISTS "Users can insert blocks" ON blocks;
CREATE POLICY "Users can insert blocks" ON blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- ============================================================
-- SCRIPT COMPLETE - All 8 tables with RLS policies
-- ============================================================