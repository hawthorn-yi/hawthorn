-- ============================================================
-- 修复 notifications RLS 策略
-- 用户需要同时能读取 to_user_id 和 from_user_id 匹配的通知
-- ============================================================

-- 删除现有的 notifications SELECT 策略
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;

-- 用户读取：to_user_id 或 from_user_id 匹配即可
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

SELECT 'RLS 策略已修复 - notifications SELECT 现在同时支持 to_user_id 和 from_user_id' AS status;
