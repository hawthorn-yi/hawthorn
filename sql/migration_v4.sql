-- ============================================================
-- Hawthorn v4.0 - Progress Entries Username Migration
-- 请在 Supabase SQL Editor 中运行此脚本:
-- https://todyqybjiwgnxfevqisl.supabase.co → SQL Editor
-- ============================================================

-- Add username column to progress_entries
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS username TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'progress_entries' 
  AND column_name = 'username';
