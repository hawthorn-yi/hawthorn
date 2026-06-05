-- ============================================================
-- 修复 RLS 无限递归问题
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 第一步：删除所有有问题的 RLS 策略
DROP POLICY IF EXISTS "admin_all_access_tasks" ON tasks;
DROP POLICY IF EXISTS "owner_all_access_tasks" ON tasks;
DROP POLICY IF EXISTS "member_view_tasks" ON tasks;
DROP POLICY IF EXISTS "member_update_tasks" ON tasks;

DROP POLICY IF EXISTS "admin_all_access_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_read_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_insert_categories" ON categories;

DROP POLICY IF EXISTS "admin_all_access_entries" ON progress_entries;
DROP POLICY IF EXISTS "owner_access_entries" ON progress_entries;
DROP POLICY IF EXISTS "member_read_entries" ON progress_entries;
DROP POLICY IF EXISTS "member_insert_entries" ON progress_entries;

DROP POLICY IF EXISTS "admin_all_access_attachments" ON attachments;
DROP POLICY IF EXISTS "owner_access_attachments" ON attachments;
DROP POLICY IF EXISTS "member_read_attachments" ON attachments;
DROP POLICY IF EXISTS "member_insert_attachments" ON attachments;

DROP POLICY IF EXISTS "admin_all_access_pm" ON project_members;
DROP POLICY IF EXISTS "owner_access_pm" ON project_members;
DROP POLICY IF EXISTS "member_read_pm" ON project_members;

DROP POLICY IF EXISTS "user_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "admin_all_access_roles" ON user_roles;
DROP POLICY IF EXISTS "anon_insert_roles" ON user_roles;

-- 第二步：创建安全函数来判断用户是否是 admin（避免递归）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 第三步：重新创建 tasks 表的 RLS 策略
CREATE POLICY "admin_all_access_tasks" ON tasks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_all_access_tasks" ON tasks FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "member_view_tasks" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE task_id = tasks.id AND user_id = auth.uid()));

CREATE POLICY "member_update_tasks" ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM project_members WHERE task_id = tasks.id AND user_id = auth.uid() AND role IN ('member', 'owner')));

-- 第四步：categories 表的 RLS 策略
CREATE POLICY "admin_all_access_categories" ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "authenticated_read_categories" ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_categories" ON categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 第五步：progress_entries 表的 RLS 策略
CREATE POLICY "admin_all_access_entries" ON progress_entries FOR ALL
  USING (is_admin());

CREATE POLICY "owner_access_entries" ON progress_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = progress_entries.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_entries" ON progress_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = progress_entries.task_id AND pm.user_id = auth.uid()));

CREATE POLICY "member_insert_entries" ON progress_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = progress_entries.task_id AND pm.user_id = auth.uid() AND pm.role IN ('member', 'owner')));

-- 第六步：attachments 表的 RLS 策略
CREATE POLICY "admin_all_access_attachments" ON attachments FOR ALL
  USING (is_admin());

CREATE POLICY "owner_access_attachments" ON attachments FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = attachments.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_attachments" ON attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = attachments.task_id AND pm.user_id = auth.uid()));

CREATE POLICY "member_insert_attachments" ON attachments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON t.id = pm.task_id
    WHERE t.id = attachments.task_id AND pm.user_id = auth.uid() AND pm.role IN ('member', 'owner')));

-- 第七步：project_members 表的 RLS 策略
CREATE POLICY "admin_all_access_pm" ON project_members FOR ALL
  USING (is_admin());

CREATE POLICY "owner_access_pm" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = project_members.task_id AND owner_id = auth.uid()));

CREATE POLICY "member_read_pm" ON project_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN project_members pm2 ON t.id = pm2.task_id
    WHERE t.id = project_members.task_id AND pm2.user_id = auth.uid()));

-- 第八步：user_roles 表的 RLS 策略（关键修复：允许插入和读取自身）
-- 允许任何人插入（注册时触发器需要）
CREATE POLICY "allow_insert_user_roles" ON user_roles FOR INSERT WITH CHECK (true);

-- 用户可以读取自己的角色
CREATE POLICY "user_read_own_role" ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Admin 可以管理所有角色（使用 is_admin() 函数避免递归）
CREATE POLICY "admin_all_access_roles" ON user_roles FOR ALL
  USING (is_admin());

-- 允许更新自己的角色（预留）
CREATE POLICY "user_update_own_role" ON user_roles FOR UPDATE
  USING (user_id = auth.uid());

-- 第九步：email_verifications 表的 RLS 策略
DROP POLICY IF EXISTS "anon_insert_verifications" ON email_verifications;
DROP POLICY IF EXISTS "anon_select_verifications" ON email_verifications;
DROP POLICY IF EXISTS "anon_update_verifications" ON email_verifications;

CREATE POLICY "anon_insert_verifications" ON email_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_verifications" ON email_verifications FOR SELECT USING (true);
CREATE POLICY "anon_update_verifications" ON email_verifications FOR UPDATE USING (true);

-- 第十步：password_reset_tokens 表的 RLS 策略
DROP POLICY IF EXISTS "anon_insert_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "anon_select_reset_tokens" ON password_reset_tokens;

CREATE POLICY "anon_insert_reset_tokens" ON password_reset_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_reset_tokens" ON password_reset_tokens FOR SELECT USING (true);

-- 验证修复
SELECT 'RLS 修复完成！' AS status;
