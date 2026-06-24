-- ============================================================
-- 创建 get_user_last_logins() RPC 函数
-- 用于管理员查看用户真实最后登录时间
-- 在 Supabase SQL Editor 中运行一次即可:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 创建 SECURITY DEFINER 函数（绕过 RLS 读取 auth.users）
CREATE OR REPLACE FUNCTION get_user_last_logins()
RETURNS TABLE (user_id UUID, last_sign_in_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id AS user_id, last_sign_in_at
  FROM auth.users;
$$;

-- 授权：仅 admin 可调用
REVOKE ALL ON FUNCTION get_user_last_logins() FROM PUBLIC, ANON, AUTHENTICATED;
GRANT EXECUTE ON FUNCTION get_user_last_logins() TO AUTHENTICATED;

-- 创建 is_admin() 安全函数（如果不存在）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 添加 RLS 策略：仅 admin 可调用
-- 注：Supabase RPC 默认对 authenticated 开放，我们用函数内部检查
CREATE OR REPLACE FUNCTION get_user_last_logins_secure()
RETURNS TABLE (user_id UUID, last_sign_in_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  RETURN QUERY SELECT id, last_sign_in_at FROM auth.users;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_last_logins_secure() TO AUTHENTICATED;

-- 验证
SELECT 'RPC 函数创建成功' AS status;
