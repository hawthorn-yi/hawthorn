-- ============================================================
-- 修复：用户最后登录时间（修正版 v3，彻底消除列名歧义）
-- 在 Supabase SQL Editor 中运行一次:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 1. 先删除旧函数
DROP FUNCTION IF EXISTS get_user_last_logins_secure();

-- 2. 重新创建（所有列引用都加表别名，彻底消除歧义）
CREATE FUNCTION get_user_last_logins_secure()
RETURNS TABLE (uid UUID, last_signin TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  RETURN QUERY SELECT au.id, au.last_sign_in_at FROM auth.users au;
END;
$$;

-- 3. 授权
GRANT EXECUTE ON FUNCTION get_user_last_logins_secure() TO AUTHENTICATED;

-- 4. 验证
SELECT '修复完成' AS status;
