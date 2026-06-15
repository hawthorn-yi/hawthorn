-- ============================================================
-- 修复 RLS 策略以支持旧版 app_users.id
-- notifications 表的 to_user_id / from_user_id 可能使用 auth.uid() 或旧版 app_users.id
-- 需要同时支持两种 ID 格式
-- ============================================================

-- 获取当前用户的旧版 app_users.id（如果存在）
CREATE OR REPLACE FUNCTION get_legacy_user_ids()
RETURNS TEXT[] AS $$
DECLARE
  auth_uid TEXT;
  display_name TEXT;
  legacy_id TEXT;
  result TEXT[];
BEGIN
  auth_uid := auth.uid()::TEXT;
  result := ARRAY[auth_uid];
  
  -- 从 user_roles 获取 display_name
  SELECT ur.display_name INTO display_name
  FROM user_roles ur
  WHERE ur.user_id = auth_uid::UUID
  LIMIT 1;
  
  -- 如果找到 display_name，查找对应的 app_users.id
  IF display_name IS NOT NULL THEN
    SELECT au.id INTO legacy_id
    FROM app_users au
    WHERE au.username = display_name
    LIMIT 1;
    
    IF legacy_id IS NOT NULL AND legacy_id != auth_uid THEN
      result := array_append(result, legacy_id);
    END IF;
  END IF;
  
  -- 也尝试通过 email 前缀匹配
  IF array_length(result, 1) = 1 THEN
    SELECT au.id INTO legacy_id
    FROM app_users au
    JOIN auth.users u ON SPLIT_PART(u.email, '@', 1) = au.username
    WHERE u.id = auth_uid::UUID
    LIMIT 1;
    
    IF legacy_id IS NOT NULL AND legacy_id != auth_uid THEN
      result := array_append(result, legacy_id);
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧的 notifications 策略
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "user_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_access_notifications" ON notifications;

-- 用户只能读取发给自己的通知（支持旧版 ID）
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (to_user_id = ANY(get_legacy_user_ids()));

-- 用户可以插入通知（@别人时）
CREATE POLICY "user_insert_notifications" ON notifications FOR INSERT
  WITH CHECK (from_user_id = ANY(get_legacy_user_ids()));

-- 用户可以标记自己的通知为已读
CREATE POLICY "user_update_own_notifications" ON notifications FOR UPDATE
  USING (to_user_id = ANY(get_legacy_user_ids()));

-- Admin 可以管理所有通知
CREATE POLICY "admin_all_access_notifications" ON notifications FOR ALL
  USING (is_admin());

-- 删除旧的 mention_replies 策略
DROP POLICY IF EXISTS "user_read_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "user_insert_mention_replies" ON mention_replies;
DROP POLICY IF EXISTS "admin_all_access_mention_replies" ON mention_replies;

-- 用户可以读取与自己相关的回复（支持旧版 ID）
CREATE POLICY "user_read_mention_replies" ON mention_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = mention_replies.notification_id
      AND (n.to_user_id = ANY(get_legacy_user_ids()) OR n.from_user_id = ANY(get_legacy_user_ids()))
    )
  );

-- 用户可以插入回复
CREATE POLICY "user_insert_mention_replies" ON mention_replies FOR INSERT
  WITH CHECK (from_user_id = ANY(get_legacy_user_ids()));

-- Admin 可以管理所有回复
CREATE POLICY "admin_all_access_mention_replies" ON mention_replies FOR ALL
  USING (is_admin());

-- 确保 Realtime 发布包含这两个表
DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

DO $$ BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE mention_replies; 
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

SELECT 'RLS 策略已更新，支持旧版 app_users.id' AS status;
