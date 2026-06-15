-- ============================================================
-- 简化 RLS 策略 - 统一使用 auth.uid()
-- 在迁移 SQL 执行之后再执行此脚本
-- ============================================================

-- 删除所有旧的复杂策略
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "user_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_access_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_full_access" ON notifications;

DROP POLICY IF EXISTS "user_read_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "user_insert_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "admin_all_access_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "anon_full_access" ON mention_replies;

DROP POLICY IF EXISTS "anon_full_access" ON tasks;
DROP POLICY IF EXISTS "anon_full_access" ON categories;
DROP POLICY IF EXISTS "anon_full_access" ON project_members;

-- ============================================================
-- notifications 策略
-- ============================================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (to_user_id = auth.uid());

-- ============================================================
-- mention_replies 策略
-- ============================================================
CREATE POLICY "mention_replies_select" ON mention_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = mention_replies.notification_id
      AND (n.to_user_id = auth.uid() OR n.from_user_id = auth.uid())
    )
  );

CREATE POLICY "mention_replies_insert" ON mention_replies FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- ============================================================
-- tasks 策略（用户可读写自己的任务 + 项目成员可读）
-- ============================================================
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.task_id = tasks.id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.task_id = tasks.id AND pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );

CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- project_members 策略
-- ============================================================
CREATE POLICY "project_members_select" ON project_members FOR SELECT
  USING (true);

CREATE POLICY "project_members_insert" ON project_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_members_delete" ON project_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- categories 保持开放（所有用户共用）
-- ============================================================
CREATE POLICY "categories_all" ON categories FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================
-- Realtime 确保开启
-- ============================================================
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE mention_replies; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE project_members; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

SELECT '✅ RLS 策略已简化，统一使用 auth.uid()' AS status;
