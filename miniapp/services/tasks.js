/**
 * 任务服务
 * 移植自 useTaskManager.ts
 */
const api = require('./api.js');
const authToken = require('../utils/auth-token.js');
const { uuid } = require('../utils/id.js');
const dateUtil = require('../utils/date.js');
const { parseMentions, resolveMentions, buildUserMap } = require('../utils/mentions.js');

const DEFAULT_CATEGORIES = [
  { id: 'new-product', name: '新产品开发', color: '#14B8A6' },
  { id: 'daily-order', name: '日常订单跟进', color: '#3B82F6' },
  { id: 'temporary', name: '临时项目', color: '#F59E0B' }
];

function getStatus(task) {
  if (task.status === 'terminated') return 'terminated';
  if (task.progress === 100) return 'completed';
  if (task.deadline) {
    const today = new Date(); today.setHours(0,0,0,0);
    const dl = new Date(task.deadline); dl.setHours(0,0,0,0);
    if (dl < today) return 'overdue';
  }
  return 'active';
}

/**
 * 获取所有数据（任务+分类+进度+附件+成员+用户）
 */
function fetchAllData() {
  const userId = authToken.getCurrentUserId();
  const user = authToken.getAuthToken();
  const isAdmin = user && user.role === 'admin';

  return Promise.all([
    api.select('categories', { select: '*', order: 'created_at', ascending: true }),
    api.select('project_members', { select: '*' }),
    api.select('tasks', { select: '*', order: 'sort_order', ascending: true, nullsFirst: true }),
    api.select('progress_entries', { select: '*', order: 'timestamp', ascending: true }),
    api.select('attachments', { select: '*' }),
    api.select('app_users', { select: 'id,username' })
  ]).then(function(results) {
    var cats = results[0] || [];
    var members = results[1] || [];
    var rawTasks = results[2] || [];
    var entries = results[3] || [];
    var atts = results[4] || [];
    var appUsers = results[5] || [];

    // 用户映射
    var userMap = {};
    var usernameToIdMap = {};
    appUsers.forEach(function(u) {
      userMap[u.id] = u.username;
      usernameToIdMap[u.username] = u.id;
      usernameToIdMap[u.username.toLowerCase()] = u.id;
    });

    // 成员丰富化
    var enrichedMembers = members.map(function(m) {
      return {
        id: m.id, task_id: m.task_id, user_id: m.user_id,
        role: m.role, username: userMap[m.user_id] || m.user_id,
        created_at: m.created_at
      };
    });

    // 当前用户成员的任务ID
    var memberTaskIds = userId
      ? members.filter(function(m) { return m.user_id === userId; }).map(function(m) { return m.task_id; })
      : [];

    // 组装任务
    var assembledTasks = rawTasks.map(function(t, i) {
      var taskEntries = entries.filter(function(e) { return e.task_id === t.id; })
        .map(function(e) {
          return { id: e.id, taskId: e.task_id, timestamp: e.timestamp, progress: e.progress, note: e.note, username: e.username };
        });
      var taskAtts = atts.filter(function(a) { return a.task_id === t.id; })
        .map(function(a) {
          return { id: a.id, name: a.name, size: a.size, dataUrl: a.data_url };
        });

      var task = {
        id: t.id, name: t.name, category: t.category,
        createdDate: t.created_date, deadline: t.deadline,
        progress: t.progress, status: t.status,
        sort_order: t.sort_order != null ? t.sort_order : i,
        owner_id: t.owner_id, assignee_id: t.assignee_id,
        assignee_username: t.assignee_username || userMap[t.assignee_id] || '',
        history: taskEntries, attachments: taskAtts
      };
      task.status = getStatus(task);
      return task;
    });

    // 过滤可见任务
    var filteredTasks = isAdmin
      ? assembledTasks
      : userId && members.length > 0
        ? assembledTasks.filter(function(t) { return memberTaskIds.indexOf(t.id) !== -1; })
        : assembledTasks;

    var categories = cats.length > 0
      ? cats.map(function(c) { return { id: c.id, name: c.name, color: c.color }; })
      : DEFAULT_CATEGORIES;

    return {
      tasks: filteredTasks,
      categories: categories,
      members: enrichedMembers,
      userMap: usernameToIdMap,
      allUsers: appUsers
    };
  });
}

/**
 * 新建任务
 */
function addTask(data) {
  var taskId = uuid();
  var entryId = uuid();
  var now = dateUtil.toISOString();
  var userId = authToken.getCurrentUserId();
  var username = authToken.getAuthToken()?.username;

  var task = {
    id: taskId, name: data.name, category: data.category,
    createdDate: data.createdDate, deadline: data.deadline,
    progress: data.progress, status: 'active',
    history: [{ id: entryId, taskId: taskId, timestamp: now, progress: data.progress, note: data.note || '创建任务', username: username }],
    attachments: [], sort_order: data.sortOrder || 0,
    owner_id: userId, assignee_id: data.assigneeId, assignee_username: data.assigneeUsername
  };
  task.status = getStatus(task);

  // 写入任务
  return api.insert('tasks', {
    id: taskId, name: data.name, category: data.category,
    created_date: data.createdDate, deadline: data.deadline,
    progress: data.progress, status: task.status,
    sort_order: task.sort_order, owner_id: userId,
    assignee_id: data.assigneeId || null, assignee_username: data.assigneeUsername || null
  }).then(function() {
    // 写入初始进度
    return api.insert('progress_entries', {
      id: entryId, task_id: taskId, timestamp: now,
      progress: data.progress, note: data.note || '创建任务', username: username
    });
  }).then(function() {
    // 创建 @提及通知
    if (data.note && data.note.trim()) {
      var mentions = parseMentions(data.note);
      if (mentions.length > 0) {
        var resolved = resolveMentions(mentions, usernameToIdMap_cached);
        var notifPromises = resolved.filter(function(m) { return m.userId !== userId; })
          .map(function(m) {
            return api.insert('notifications', {
              id: uuid(), from_user_id: userId, to_user_id: m.userId,
              task_id: taskId, progress_entry_id: entryId,
              note: data.note.trim(), mentioned_username: m.username
            });
          });
        return Promise.all(notifPromises);
      }
    }
  }).then(function() {
    // 添加创建者为 owner
    if (userId) {
      return api.insert('project_members', { id: uuid(), task_id: taskId, user_id: userId, role: 'owner' });
    }
  }).then(function() {
    // 添加其他成员
    if (data.memberIds && data.memberIds.length > 0) {
      var memberPromises = data.memberIds.filter(function(mid) { return mid !== userId; })
        .map(function(mid) {
          return api.insert('project_members', { id: uuid(), task_id: taskId, user_id: mid, role: 'member' });
        });
      return Promise.all(memberPromises);
    }
  }).then(function() {
    return task;
  });
}

// 缓存 userMap
var usernameToIdMap_cached = {};
function setUserMap(map) { usernameToIdMap_cached = map; }

/**
 * 更新任务
 */
function updateTask(taskId, data) {
  var updatePayload = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.createdDate !== undefined) updatePayload.created_date = data.createdDate;
  if (data.deadline !== undefined) updatePayload.deadline = data.deadline;
  if (data.progress !== undefined) updatePayload.progress = Math.max(0, Math.min(100, data.progress));
  if (data.assigneeId !== undefined) updatePayload.assignee_id = data.assigneeId || null;
  if (data.assigneeUsername !== undefined) updatePayload.assignee_username = data.assigneeUsername || null;
  updatePayload.updated_at = dateUtil.toISOString();

  return api.update('tasks', { eq: { id: taskId } }, updatePayload).then(function() {
    // 判断是否需要添加进度记录
    var hasNote = data.note !== undefined && data.note.trim() !== '';
    if (hasNote || data.progress !== undefined || data.deadline !== undefined || data.assigneeId !== undefined) {
      var entryId = uuid();
      var username = authToken.getAuthToken()?.username;
      var noteText = '';

      if (hasNote) {
        noteText = data.note.trim();
      } else if (data.assigneeId !== undefined) {
        noteText = data.assigneeId ? '指派给了 ' + (data.assigneeUsername || data.assigneeId) : '取消了指派';
      } else if (data.deadline !== undefined) {
        noteText = '截止日期调整为 ' + data.deadline;
      } else {
        noteText = '进度更新至 ' + data.progress + '%';
      }

      return api.insert('progress_entries', {
        id: entryId, task_id: taskId, timestamp: dateUtil.toISOString(),
        progress: data.progress !== undefined ? Math.max(0, Math.min(100, data.progress)) : 0,
        note: noteText, username: username
      }).then(function() {
        // @提及通知
        if (hasNote) {
          var mentions = parseMentions(data.note);
          if (mentions.length > 0) {
            var fromUserId = authToken.getCurrentUserId();
            var resolved = resolveMentions(mentions, usernameToIdMap_cached);
            var promises = resolved.filter(function(m) { return m.userId !== fromUserId; })
              .map(function(m) {
                return api.insert('notifications', {
                  id: uuid(), from_user_id: fromUserId, to_user_id: m.userId,
                  task_id: taskId, progress_entry_id: entryId,
                  note: data.note.trim(), mentioned_username: m.username
                });
              });
            return Promise.all(promises);
          }
        }
      });
    }
  });
}

/**
 * 切换完成状态
 */
function toggleComplete(taskId, currentProgress) {
  var newProgress = currentProgress === 100 ? 0 : 100;
  var entryId = uuid();
  var now = dateUtil.toISOString();
  var username = authToken.getAuthToken()?.username;
  var status = newProgress === 100 ? 'completed' : 'active';

  return api.update('tasks', { eq: { id: taskId } }, {
    progress: newProgress, status: status, updated_at: now
  }).then(function() {
    return api.insert('progress_entries', {
      id: entryId, task_id: taskId, timestamp: now,
      progress: newProgress, note: currentProgress === 100 ? '重新打开' : '标记完成',
      username: username
    });
  }).then(function() {
    return { progress: newProgress, status: status };
  });
}

/**
 * 终止任务
 */
function terminateTask(taskId) {
  var entryId = uuid();
  var now = dateUtil.toISOString();
  var username = authToken.getAuthToken()?.username;

  return api.update('tasks', { eq: { id: taskId } }, {
    status: 'terminated', updated_at: now
  }).then(function() {
    return api.insert('progress_entries', {
      id: entryId, task_id: taskId, timestamp: now,
      progress: 0, note: '项目已终止', username: username
    });
  });
}

/**
 * 恢复任务
 */
function restoreTask(taskId, taskProgress) {
  var entryId = uuid();
  var now = dateUtil.toISOString();
  var username = authToken.getAuthToken()?.username;

  return api.update('tasks', { eq: { id: taskId } }, {
    status: 'active', updated_at: now
  }).then(function() {
    return api.insert('progress_entries', {
      id: entryId, task_id: taskId, timestamp: now,
      progress: taskProgress || 0, note: '项目已恢复', username: username
    });
  });
}

/**
 * 删除任务
 */
function deleteTask(taskId) {
  return api.remove('tasks', { eq: { id: taskId } });
}

/**
 * 重新排序
 */
function reorderTasks(reorderedIds) {
  var promises = reorderedIds.map(function(id, index) {
    return api.update('tasks', { eq: { id: id } }, { sort_order: index });
  });
  return Promise.all(promises);
}

/**
 * 移动任务（上移/下移/置顶/置底）
 */
function moveTask(taskId, direction, tasks) {
  var sortedTasks = tasks.slice().sort(function(a, b) { return a.sort_order - b.sort_order; });
  var currentIndex = -1;
  for (var i = 0; i < sortedTasks.length; i++) {
    if (sortedTasks[i].id === taskId) { currentIndex = i; break; }
  }
  if (currentIndex === -1) return Promise.resolve(tasks);

  var newIndex;
  switch (direction) {
    case 'up': newIndex = Math.max(0, currentIndex - 1); break;
    case 'down': newIndex = Math.min(sortedTasks.length - 1, currentIndex + 1); break;
    case 'top': newIndex = 0; break;
    case 'bottom': newIndex = sortedTasks.length - 1; break;
    default: return Promise.resolve(tasks);
  }
  if (newIndex === currentIndex) return Promise.resolve(tasks);

  // 交换位置
  var movedTask = sortedTasks.splice(currentIndex, 1)[0];
  sortedTasks.splice(newIndex, 0, movedTask);
  var newIds = sortedTasks.map(function(t) { return t.id; });
  return reorderTasks(newIds).then(function() {
    return sortedTasks.map(function(t, idx) {
      return Object.assign({}, t, { sort_order: idx });
    });
  });
}

/**
 * 删除进度记录
 */
function deleteHistoryEntry(entryId, taskId) {
  return api.remove('progress_entries', { eq: { id: entryId }, and: { task_id: taskId } });
}

/**
 * 导出数据为 JSON
 */
function exportData(tasks, categories) {
  return JSON.stringify({ tasks: tasks, categories: categories, exportedAt: dateUtil.toISOString() }, null, 2);
}

/**
 * 导入数据
 */
function importData(jsonStr) {
  var data;
  try { data = JSON.parse(jsonStr); } catch(e) { return Promise.reject(new Error('JSON 格式错误')); }
  if (!data.tasks || !Array.isArray(data.tasks)) return Promise.reject(new Error('数据格式错误'));

  var promises = [];
  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach(function(cat) {
      promises.push(api.upsert('categories', { id: cat.id, name: cat.name, color: cat.color }, 'id'));
    });
  }
  data.tasks.forEach(function(t) {
    promises.push(api.upsert('tasks', {
      id: t.id, name: t.name, category: t.category,
      created_date: t.createdDate, deadline: t.deadline,
      progress: t.progress, status: getStatus(t)
    }, 'id'));
    if (t.history && Array.isArray(t.history)) {
      t.history.forEach(function(h) {
        promises.push(api.upsert('progress_entries', {
          id: h.id, task_id: h.taskId || t.id, timestamp: h.timestamp,
          progress: h.progress, note: h.note
        }, 'id'));
      });
    }
    if (t.attachments && Array.isArray(t.attachments)) {
      t.attachments.forEach(function(a) {
        promises.push(api.upsert('attachments', {
          id: a.id, task_id: t.id, name: a.name, size: a.size, data_url: a.dataUrl
        }, 'id'));
      });
    }
  });
  return Promise.all(promises);
}

/**
 * 清除所有数据
 */
function clearAllData() {
  return api.remove('attachments', { neq: { id: '__none__' } })
    .then(function() { return api.remove('progress_entries', { neq: { id: '__none__' } }); })
    .then(function() { return api.remove('project_members', { neq: { id: '__none__' } }); })
    .then(function() { return api.remove('tasks', { neq: { id: '__none__' } }); })
    .then(function() { return api.remove('categories', { neq: { id: '__none__' } }); })
    .then(function() {
      var promises = DEFAULT_CATEGORIES.map(function(cat) {
        return api.insert('categories', { id: cat.id, name: cat.name, color: cat.color });
      });
      return Promise.all(promises);
    });
}

module.exports = {
  fetchAllData, addTask, updateTask, deleteTask,
  toggleComplete, terminateTask, restoreTask,
  reorderTasks, moveTask, deleteHistoryEntry,
  exportData, importData, clearAllData,
  getStatus, setUserMap, DEFAULT_CATEGORIES
};
