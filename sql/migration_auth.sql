-- ============================================================
-- Project Progress - Authentication Migration
-- Run this in Supabase SQL Editor:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. Insert default admin account (password: admin)
INSERT INTO app_users (id, username, password_hash, role, is_approved) VALUES
  ('admin-001', 'admin', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on app_users
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "allow_register" ON app_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_read_own" ON app_users
  FOR SELECT
  USING (true);

CREATE POLICY "allow_update_any" ON app_users
  FOR UPDATE
  USING (true);

CREATE POLICY "allow_delete_any" ON app_users
  FOR DELETE
  USING (true);

-- 5. Enable Realtime for app_users
ALTER PUBLICATION supabase_realtime ADD TABLE app_users;

-- 6. Verify tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('tasks', 'categories', 'app_users');
