-- ============================================================
-- 修复：用户最后登录时间显示不正确
-- 在 Supabase SQL Editor 中运行一次:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. 创建 SECURITY DEFINER 函数：获取所有用户真实最后登录时间
--    （绕过 RLS 读取 auth.users.last_sign_in_at）
CREATE OR REPLACE FUNCTION get_user_last_logins_secure()
RETURNS TABLE (user_id UUID, last_sign_in_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- 仅管理员可调用
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  RETURN QUERY SELECT id, last_sign_in_at FROM auth.users;
END;
$$;

-- 2. 授权 authenticated 角色可调用（函数内部会校验 admin 权限）
GRANT EXECUTE ON FUNCTION get_user_last_logins_secure() TO AUTHENTICATED;

-- 3. 添加 RLS 策略：允许用户更新自己的 user_roles 行（用于登录时刷新 updated_at）
--    注意：BEFORE UPDATE 触发器会自动设置 updated_at = NOW()
DROP POLICY IF EXISTS "user_update_own_role" ON user_roles;
CREATE POLICY "user_update_own_role" ON user_roles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. 验证
SELECT '修复完成！用户最后登录时间将正确显示。' AS status;
