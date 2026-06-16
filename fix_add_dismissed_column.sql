-- ============================================================
-- 为 notifications 表添加 dismissed 列
-- 用于"我@别人的"中的"终止回复"功能
-- 当发送者确认不再需要回复时，将 dismissed 设为 true
-- 请在 Supabase SQL Editor 中运行
-- ============================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT FALSE;

-- 验证
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name = 'dismissed';
