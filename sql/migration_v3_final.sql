-- ============================================================
-- Hawthorn v3.0 - Database Migration
-- 请在 Supabase SQL Editor 中运行此脚本:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. 为 tasks 表添加 assignee_id 和 assignee_username 列
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_username TEXT;

-- 2. 确保 project_members 表有正确的 UNIQUE 约束
-- (如果已存在则忽略)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'project_members_task_id_user_id_key'
  ) THEN
    ALTER TABLE project_members ADD CONSTRAINT project_members_task_id_user_id_key UNIQUE(task_id, user_id);
  END IF;
END $$;

-- 3. 确保 project_members 表已启用 Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
EXCEPTION WHEN duplicate_object THEN
  -- Already in publication
END $$;

-- 4. 创建索引以提升性能
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_task_id ON project_members(task_id);

-- 5. 验证
SELECT 
  'tasks columns' AS check_item,
  string_agg(column_name, ', ') AS result
FROM information_schema.columns
WHERE table_name = 'tasks' 
  AND column_name IN ('assignee_id', 'assignee_username', 'owner_id');

SELECT 
  'project_members exists' AS check_item,
  count(*)::text AS result
FROM project_members;

SELECT 
  'app_users count' AS check_item,
  count(*)::text AS result
FROM app_users;
