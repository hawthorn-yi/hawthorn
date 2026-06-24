-- ============================================================
-- 修复：用户最后登录时间显示不正确（修正版，解决列名歧义）
-- 在 Supabase SQL Editor 中运行一次:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. 重新创建函数（使用表别名 au 消除列名歧义）
CREATE OR REPLACE FUNCTION get_user_last_logins_secure()
RETURNS TABLE (user_id UUID, last_sign_in_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  RETURN QUERY SELECT au.id, au.last_sign_in_at FROM auth.users au;
END;
$$;

-- 2. 授权
GRANT EXECUTE ON FUNCTION get_user_last_logins_secure() TO AUTHENTICATED;

-- 3. 允许用户更新自己的 user_roles（登录时刷新 updated_at）
DROP POLICY IF EXISTS "user_update_own_role" ON user_roles;
CREATE POLICY "user_update_own_role" ON user_roles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. 验证
SELECT '修复完成' AS status;
