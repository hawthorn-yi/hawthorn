-- ============================================================
-- 修复"我@别人的"页面无法显示数据的问题
-- 以及抽屉页面回复/@消息未同步到通知列表的问题
--
-- 根本原因：
-- 1. notifications 表的 RLS 策略只允许 to_user_id = auth.uid() 的 SELECT
--    导致 from_user_id = auth.uid() 的查询被 RLS 阻止
--    即普通用户无法查看自己发出的 @消息（"我@别人的"页面始终为空）
--
-- 2. Supabase Realtime 受 RLS 约束
--    useMyMentions 订阅 from_user_id=eq.{userId} 的 INSERT 事件
--    但因 RLS 阻止 SELECT，Realtime 事件也无法被接收
--    导致抽屉中 @别人后，"我@别人的"列表和数量不更新
--
-- 请在 Supabase SQL Editor 中运行:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- 添加策略：允许用户查看自己发出的通知（我@别人的）
-- 这条策略与已有的 user_read_own_notifications (to_user_id = auth.uid()) 互补
-- RLS 的多个 SELECT 策略是 OR 关系，满足任一即可读取
CREATE POLICY "user_read_sent_notifications" ON notifications FOR SELECT
  USING (from_user_id = auth.uid());

-- 验证：查看 notifications 表当前所有 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- 验证
SELECT '修复完成！已添加 user_read_sent_notifications 策略。' AS status;
