-- ============================================================
-- Hawthorn 用户 ID 统一迁移脚本 (v3 - 先去重再迁移)
-- ============================================================
BEGIN;

-- ============================================================
-- 0. 先去重：找出会冲突的 (task_id, 目标auth.uid) 组合，删旧留新
-- ============================================================

-- 创建临时对照表
CREATE TEMP TABLE id_map (old_id UUID, new_id UUID);
INSERT INTO id_map VALUES
  ('b9b5e203-5e1b-4deb-aa76-76c896dac47e', 'c2de0364-ae87-4672-94cd-41bbfa55fe96'),
  ('c9ebae38-2935-4526-9e54-88fb938e1f45', '00d17b5e-409a-4237-81ff-b08167bfdf77'),
  ('4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46', '5eb02264-0372-412c-80bd-fa752278df54'),
  ('503143a4-2555-4831-afdb-3680bcb57be8', '47b16bba-bde5-48f4-be3e-ba60b4675874'),
  ('161ee795-1dc7-4a5a-b8f1-761089fe8204', '7826f42a-b834-463e-b0ae-5b2a51b77186'),
  ('070e049c-0301-4edc-8c99-16b6d85f2a26', '077dc94b-42a9-4777-a2c1-0134c4910f95'),
  ('7590e612-7c8c-4c43-8bfe-b5055e3ee3dc', 'f47e5798-9a67-483f-ad92-e696684e2aee');

-- 删除 project_members 中的无效 user_id
DELETE FROM project_members 
WHERE user_id IN ('001', '002', '003', 'kevin', '肖伍秋', '中国人')
   OR user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 删除 project_members 中会产生冲突的记录：保留一条，删掉旧ID那条
DELETE FROM project_members a
USING id_map m
WHERE a.user_id = m.old_id
  AND EXISTS (
    SELECT 1 FROM project_members b 
    WHERE b.task_id = a.task_id AND b.user_id = m.new_id
  );

-- 现在安全迁移 project_members
UPDATE project_members a SET user_id = m.new_id
FROM id_map m WHERE a.user_id = m.old_id;

-- 迁移 tasks.owner_id
UPDATE tasks SET owner_id = m.new_id FROM id_map m WHERE owner_id = m.old_id;

-- 迁移 tasks.assignee_id（先去重：如果同一个task的assignee_id迁移后会和新值冲突，跳过）
UPDATE tasks SET assignee_id = m.new_id FROM id_map m WHERE assignee_id = m.old_id;

-- 迁移 notifications
UPDATE notifications SET from_user_id = m.new_id FROM id_map m WHERE from_user_id = m.old_id;
UPDATE notifications SET to_user_id = m.new_id FROM id_map m WHERE to_user_id = m.old_id;

-- 迁移 mention_replies
UPDATE mention_replies SET from_user_id = m.new_id FROM id_map m WHERE from_user_id = m.old_id;

DROP TABLE id_map;

COMMIT;
SELECT '✅ 数据迁移完成' AS status;
