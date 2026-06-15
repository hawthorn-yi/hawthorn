-- ============================================================
-- Hawthorn 用户 ID 统一迁移脚本
-- 将所有表从 app_users.id 迁移到 auth.uid()
-- 
-- 对照表（7个用户）：
-- kevin:    b9b5e203 → c2de0364
-- 肖伍秋:    c9ebae38 → 00d17b5e
-- 刘 红:     4e8cc6f4 → 5eb02264
-- 奉江妹:    503143a4 → 47b16bba
-- 龚GONG:   161ee795 → 7826f42a
-- 赵忠平:    070e049c → 077dc94b
-- 测试用户:  7590e612 → f47e5798
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 清理 project_members 中的无效 user_id
-- ============================================================
DELETE FROM project_members 
WHERE user_id IN ('001', '002', '003', 'kevin', '肖伍秋', '中国人')
   OR user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ============================================================
-- 2. 迁移 project_members.user_id
-- ============================================================
UPDATE project_members SET user_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE user_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE project_members SET user_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE user_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE project_members SET user_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE user_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE project_members SET user_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE user_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE project_members SET user_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE user_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE project_members SET user_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE user_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE project_members SET user_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE user_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 3. 迁移 tasks.owner_id
-- ============================================================
UPDATE tasks SET owner_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE owner_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE tasks SET owner_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE owner_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE tasks SET owner_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE owner_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE tasks SET owner_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE owner_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE tasks SET owner_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE owner_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE tasks SET owner_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE owner_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE tasks SET owner_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE owner_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 4. 迁移 tasks.assignee_id
-- ============================================================
UPDATE tasks SET assignee_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE assignee_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE tasks SET assignee_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE assignee_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE tasks SET assignee_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE assignee_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE tasks SET assignee_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE assignee_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE tasks SET assignee_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE assignee_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE tasks SET assignee_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE assignee_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE tasks SET assignee_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE assignee_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 5. 迁移 notifications.from_user_id
-- ============================================================
UPDATE notifications SET from_user_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE from_user_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE notifications SET from_user_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE from_user_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE notifications SET from_user_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE from_user_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE notifications SET from_user_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE from_user_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE notifications SET from_user_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE from_user_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE notifications SET from_user_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE from_user_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE notifications SET from_user_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE from_user_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 6. 迁移 notifications.to_user_id
-- ============================================================
UPDATE notifications SET to_user_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE to_user_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE notifications SET to_user_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE to_user_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE notifications SET to_user_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE to_user_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE notifications SET to_user_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE to_user_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE notifications SET to_user_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE to_user_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE notifications SET to_user_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE to_user_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE notifications SET to_user_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE to_user_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 7. 迁移 mention_replies.from_user_id
-- ============================================================
UPDATE mention_replies SET from_user_id = 'c2de0364-ae87-4672-94cd-41bbfa55fe96' WHERE from_user_id = 'b9b5e203-5e1b-4deb-aa76-76c896dac47e';
UPDATE mention_replies SET from_user_id = '00d17b5e-409a-4237-81ff-b08167bfdf77' WHERE from_user_id = 'c9ebae38-2935-4526-9e54-88fb938e1f45';
UPDATE mention_replies SET from_user_id = '5eb02264-0372-412c-80bd-fa752278df54' WHERE from_user_id = '4e8cc6f4-2e20-497f-8cc5-7ae05b2dbe46';
UPDATE mention_replies SET from_user_id = '47b16bba-bde5-48f4-be3e-ba60b4675874' WHERE from_user_id = '503143a4-2555-4831-afdb-3680bcb57be8';
UPDATE mention_replies SET from_user_id = '7826f42a-b834-463e-b0ae-5b2a51b77186' WHERE from_user_id = '161ee795-1dc7-4a5a-b8f1-761089fe8204';
UPDATE mention_replies SET from_user_id = '077dc94b-42a9-4777-a2c1-0134c4910f95' WHERE from_user_id = '070e049c-0301-4edc-8c99-16b6d85f2a26';
UPDATE mention_replies SET from_user_id = 'f47e5798-9a67-483f-ad92-e696684e2aee' WHERE from_user_id = '7590e612-7c8c-4c43-8bfe-b5055e3ee3dc';

-- ============================================================
-- 8. 验证迁移结果
-- ============================================================
SELECT '=== 迁移后各表的 user_id 分布 ===' AS info;

SELECT 'project_members' AS table_name, user_id, count(*) 
FROM project_members GROUP BY user_id ORDER BY count(*) DESC;

SELECT 'tasks.owner_id' AS table_name, owner_id AS user_id, count(*) 
FROM tasks WHERE owner_id IS NOT NULL GROUP BY owner_id ORDER BY count(*) DESC;

SELECT 'tasks.assignee_id' AS table_name, assignee_id AS user_id, count(*) 
FROM tasks WHERE assignee_id IS NOT NULL GROUP BY assignee_id ORDER BY count(*) DESC;

SELECT 'notifications.from' AS table_name, from_user_id AS user_id, count(*) 
FROM notifications GROUP BY from_user_id ORDER BY count(*) DESC;

SELECT 'notifications.to' AS table_name, to_user_id AS user_id, count(*) 
FROM notifications GROUP BY to_user_id ORDER BY count(*) DESC;

SELECT 'mention_replies' AS table_name, from_user_id AS user_id, count(*) 
FROM mention_replies GROUP BY from_user_id ORDER BY count(*) DESC;

COMMIT;

SELECT '✅ 迁移完成！所有用户 ID 已统一为 auth.uid()' AS status;
