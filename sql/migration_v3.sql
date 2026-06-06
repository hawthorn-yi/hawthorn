-- ============================================================
-- Hawthorn v3.0 - Project Members & Task Assignment Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- 2. Create task_assignees table
CREATE TABLE IF NOT EXISTS task_assignees (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies (using anon key access pattern)
CREATE POLICY "anon_full_access" ON project_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_full_access" ON task_assignees
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Add owner_id column to tasks if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN owner_id TEXT;
  END IF;
END $$;

-- 6. Add sort_order column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- 7. Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_task_id ON project_members(task_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('project_members', 'task_assignees');
