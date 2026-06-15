-- ============================================================
-- 修复 RLS 策略：notifications 的 from_user_id/to_user_id 使用 app_users.id
-- 但 auth.uid() 和 app_users.id 是不同的 UUID
-- 需要通过 user_roles.display_name 桥接
-- ============================================================

-- 辅助函数：获取当前用户对应的 app_users.id
CREATE OR REPLACE FUNCTION get_my_app_user_ids()
RETURNS UUID[] AS $$
DECLARE
  auth_uid UUID;
  display_name TEXT;
  app_user_id UUID;
  result UUID[];
BEGIN
  auth_uid := auth.uid();
  result := ARRAY[auth_uid];
  
  -- 从 user_roles 获取 display_name
  SELECT ur.display_name INTO display_name
  FROM user_roles ur
  WHERE ur.user_id = auth_uid
  LIMIT 1;
  
  -- 用 display_name 查找 app_users.id
  IF display_name IS NOT NULL THEN
    SELECT au.id INTO app_user_id
    FROM app_users au
    WHERE au.username = display_name
    LIMIT 1;
    
    IF app_user_id IS NOT NULL AND app_user_id != auth_uid THEN
      result := array_append(result, app_user_id);
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重建 notifications SELECT 策略
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;

CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (to_user_id = ANY(get_my_app_user_ids()) OR from_user_id = ANY(get_my_app_user_ids()));

-- 重建 mention_replies SELECT 策略
DROP POLICY IF EXISTS "user_read_mention_replies" ON mention_replies;

CREATE POLICY "user_read_mention_replies" ON mention_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = mention_replies.notification_id
      AND (n.to_user_id = ANY(get_my_app_user_ids()) OR n.from_user_id = ANY(get_my_app_user_ids()))
    )
  );

SELECT 'RLS 策略已修复 - 支持 app_users.id 和 auth.uid 双 ID 匹配' AS status;
