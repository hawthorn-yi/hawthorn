-- ============================================================
-- 修复 @消息数字提醒不显示的问题
-- 1. 为 notifications 和 mention_replies 表启用 Realtime
-- 2. 为这两个表设置 RLS 策略
-- 请在 Supabase SQL Editor 中运行:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 第一步：为 notifications 表启用 RLS（如果未启用）
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "user_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_access_notifications" ON notifications;

-- 用户只能读取发给自己的通知
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (to_user_id = auth.uid());

-- 用户可以插入通知（@别人时）
CREATE POLICY "user_insert_notifications" ON notifications FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- 用户可以标记自己的通知为已读
CREATE POLICY "user_update_own_notifications" ON notifications FOR UPDATE
  USING (to_user_id = auth.uid());

-- Admin 可以管理所有通知
CREATE POLICY "admin_all_access_notifications" ON notifications FOR ALL
  USING (is_admin());

-- 第二步：为 mention_replies 表启用 RLS
ALTER TABLE IF EXISTS mention_replies ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "user_read_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "user_insert_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "admin_all_access_mention_replies" ON mention_replies;

-- 用户可以读取与自己相关的回复
CREATE POLICY "user_read_mention_replies" ON mention_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = mention_replies.notification_id
      AND (n.to_user_id = auth.uid() OR n.from_user_id = auth.uid())
    )
  );

-- 用户可以插入回复
CREATE POLICY "user_insert_mention_replies" ON mention_replies FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Admin 可以管理所有回复
CREATE POLICY "admin_all_access_mention_replies" ON mention_replies FOR ALL
  USING (is_admin());

-- 第三步：将 notifications 和 mention_replies 添加到 Realtime 发布
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE mention_replies; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- 验证
SELECT '修复完成！notifications 和 mention_replies 已启用 RLS 和 Realtime。' AS status;
