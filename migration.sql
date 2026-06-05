-- ============================================================
-- Project Progress - 完整迁移脚本 (多用户认证+权限)
-- 在 Supabase Dashboard SQL Editor 中执行:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. 添加 owner_id 到 tasks 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tasks' AND column_name='owner_id') THEN
    ALTER TABLE tasks ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. 创建 progress_entries 表
CREATE TABLE IF NOT EXISTS progress_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 创建 attachments 表
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  data_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 创建 project_members 表（项目成员/权限）
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- 5. 创建 email_verifications 表（邮箱验证码）
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 创建 password_reset_tokens 表
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. 创建 user_roles 表
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_tasks_updated_at') THEN
    CREATE TRIGGER set_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_user_roles_updated_at') THEN
    CREATE TRIGGER set_user_roles_updated_at
      BEFORE UPDATE ON user_roles
      FOR EACH ROW
      EXECUTE FUNCTION update_user_roles_updated_at();
  END IF;
END $$;

-- 9. 启用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 10. 删除旧的匿名访问策略
DROP POLICY IF EXISTS "anon_full_access" ON tasks;
DROP POLICY IF EXISTS "anon_full_access" ON categories;

-- 11. tasks 表的 RLS 策略
CREATE POLICY "admin_all_access_tasks" ON tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "owner_all_access_tasks" ON tasks FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "member_view_tasks" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE task_id = tasks.id AND user_id = auth.uid()));

CREATE POLICY "member_update_tasks" ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM project_members WHERE task_id = tasks.id AND user_id = auth.uid() AND role IN ('member', 'owner')));

-- 12. categories 表的 RLS 策略
CREATE POLICY "admin_all_access_categories" ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "authenticated_read_categories" ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_categories" ON categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 13. progress_entries 表的 RLS 策略
CREATE POLICY "admin_all_access_entries" ON progress_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "owner_access_entries" ON progress_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = progress_entries.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_entries" ON progress_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = progress_entries.task_id AND pm.user_id = auth.uid()));

CREATE POLICY "member_insert_entries" ON progress_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = progress_entries.task_id AND pm.user_id = auth.uid() AND pm.role IN ('member', 'owner')));

-- 14. attachments 表的 RLS 策略
CREATE POLICY "admin_all_access_attachments" ON attachments FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "owner_access_attachments" ON attachments FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = attachments.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_attachments" ON attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = attachments.task_id AND pm.user_id = auth.uid()));

CREATE POLICY "member_insert_attachments" ON attachments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = attachments.task_id AND pm.user_id = auth.uid() AND pm.role IN ('member', 'owner')));

-- 15. project_members 表的 RLS 策略
CREATE POLICY "admin_all_access_pm" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "owner_access_pm" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = project_members.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_pm" ON project_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm2 ON t.id = pm2.task_id
    WHERE t.id = project_members.task_id AND pm2.user_id = auth.uid()));

-- 16. email_verifications 表的 RLS 策略
CREATE POLICY "anon_insert_verifications" ON email_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_verifications" ON email_verifications FOR SELECT USING (true);
CREATE POLICY "anon_update_verifications" ON email_verifications FOR UPDATE USING (true);

-- 17. password_reset_tokens 表的 RLS 策略
CREATE POLICY "anon_insert_reset_tokens" ON password_reset_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_reset_tokens" ON password_reset_tokens FOR SELECT USING (true);

-- 18. user_roles 表的 RLS 策略
CREATE POLICY "user_read_own_role" ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admin_all_access_roles" ON user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "anon_insert_roles" ON user_roles FOR INSERT WITH CHECK (true);

-- 19. 启用 Realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE progress_entries; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE attachments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE project_members; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 20. 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_task_id ON progress_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_project_members_task_id ON project_members(task_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- 21. 第一个注册的用户自动成为 admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_roles) = 0 THEN
    INSERT INTO user_roles (user_id, role, display_name)
    VALUES (NEW.id, 'admin', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  ELSE
    INSERT INTO user_roles (user_id, role, display_name)
    VALUES (NEW.id, 'user', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;
