-- ============================================================
-- 修复 notifications 和 mention_replies 的 RLS 策略
-- 两个表的 user_id 字段都是 UUID 类型，直接使用 auth.uid()
-- ============================================================

-- 1. 删除旧的 notifications 策略（如果存在）
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "user_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_access_notifications" ON notifications;

-- 2. notifications 策略
-- 用户读取发给自己的通知
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (to_user_id = auth.uid());

-- 用户插入通知（@别人时）
CREATE POLICY "user_insert_notifications" ON notifications FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- 用户标记自己的通知为已读
CREATE POLICY "user_update_own_notifications" ON notifications FOR UPDATE
  USING (to_user_id = auth.uid());

-- 3. 删除旧的 mention_replies 策略
DROP POLICY IF EXISTS "user_read_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "user_insert_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "admin_all_access_mention_replies" ON mention_replies;

-- 4. mention_replies 策略
-- 用户读取与自己相关的回复
CREATE POLICY "user_read_mention_replies" ON mention_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = mention_replies.notification_id
      AND (n.to_user_id = auth.uid() OR n.from_user_id = auth.uid())
    )
  );

-- 用户插入回复
CREATE POLICY "user_insert_mention_replies" ON mention_replies FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- 5. 确保 Realtime 发布包含这两个表
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE mention_replies; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

SELECT 'RLS 策略已修复' AS status;
