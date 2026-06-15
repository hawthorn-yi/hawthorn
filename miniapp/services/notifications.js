/**
 * 通知服务
 * 移植自 useNotifications.ts
 */
const api = require('./api.js');
const authToken = require('../utils/auth-token.js');
const { uuid } = require('../utils/id.js');
const dateUtil = require('../utils/date.js');
const mentionsUtil = require('../utils/mentions.js');

/**
 * 获取收到的通知
 */
function fetchNotifications() {
  var userId = authToken.getCurrentUserId();
  if (!userId) return Promise.resolve([]);

  return api.select('notifications', {
    select: 'id,from_user_id,to_user_id,task_id,progress_entry_id,note,mentioned_username,is_read,reply_count,created_at',
    eq: { to_user_id: userId },
    order: 'created_at', ascending: false, limit: 100
  }).then(function(data) {
    var notifIds = (data || []).map(function(n) { return n.id; });

    if (notifIds.length === 0) return [];

    // 获取回复
    return api.select('mention_replies', {
      select: 'id,notification_id,content,created_at,from_user_id',
      in: { notification_id: notifIds },
      order: 'created_at', ascending: true
    }).then(function(repliesData) {
      // 获取用户映射
      return api.select('app_users', { select: 'id,username' }).then(function(users) {
        var userMap = {};
        users.forEach(function(u) { userMap[u.id] = u.username; });

        var repliesMap = {};
        (repliesData || []).forEach(function(r) {
          if (!repliesMap[r.notification_id]) repliesMap[r.notification_id] = [];
          repliesMap[r.notification_id].push({
            id: r.id, notification_id: r.notification_id,
            from_username: userMap[r.from_user_id] || '未知',
            content: r.content, created_at: r.created_at
          });
        });

        // 获取任务名称
        var taskIds = (data || []).map(function(n) { return n.task_id; });
        var uniqueTaskIds = [];
        var seen = {};
        taskIds.forEach(function(id) {
          if (!seen[id]) { seen[id] = true; uniqueTaskIds.push(id); }
        });

        return api.select('tasks', {
          select: 'id,name', in: { id: uniqueTaskIds }
        }).then(function(tasks) {
          var taskMap = {};
          (tasks || []).forEach(function(t) { taskMap[t.id] = t.name; });

          return (data || []).map(function(n) {
            return {
              id: n.id,
              from_user_id: n.from_user_id,
              from_username: userMap[n.from_user_id] || n.mentioned_username || '未知',
              to_user_id: n.to_user_id,
              task_id: n.task_id,
              task_name: taskMap[n.task_id] || '未知任务',
              progress_entry_id: n.progress_entry_id,
              note: n.note,
              mentioned_username: n.mentioned_username,
              is_read: n.is_read || false,
              reply_count: n.reply_count || 0,
              created_at: n.created_at,
              replies: repliesMap[n.id] || []
            };
          });
        });
      });
    });
  });
}

/**
 * 获取我发出的 @提及（按 progress_entry_id 分组）
 */
function fetchMyMentions() {
  var userId = authToken.getCurrentUserId();
  if (!userId) return Promise.resolve([]);

  return api.select('notifications', {
    select: 'id,from_user_id,to_user_id,task_id,progress_entry_id,note,mentioned_username,is_read,reply_count,created_at',
    eq: { from_user_id: userId },
    order: 'created_at', ascending: false, limit: 200
  }).then(function(data) {
    if (!data || data.length === 0) return [];

    var taskIds = [];
    var seen = {};
    data.forEach(function(n) {
      if (!seen[n.task_id]) { seen[n.task_id] = true; taskIds.push(n.task_id); }
    });

    return api.select('tasks', { select: 'id,name', in: { id: taskIds } }).then(function(tasks) {
      return api.select('app_users', { select: 'id,username' }).then(function(users) {
        var taskMap = {};
        (tasks || []).forEach(function(t) { taskMap[t.id] = t.name; });
        var userMap = {};
        users.forEach(function(u) { userMap[u.id] = u.username; });

        return data.map(function(n) {
          return {
            id: n.id, from_user_id: n.from_user_id,
            to_user_id: n.to_user_id,
            to_username: userMap[n.to_user_id] || n.mentioned_username || '未知',
            task_id: n.task_id, task_name: taskMap[n.task_id] || '未知任务',
            progress_entry_id: n.progress_entry_id,
            note: n.note, mentioned_username: n.mentioned_username,
            is_read: n.is_read, reply_count: n.reply_count,
            created_at: n.created_at
          };
        });
      });
    });
  });
}

/**
 * 获取未读通知数
 */
function getUnreadCount(userId) {
  return api.select('notifications', {
    select: 'id',
    eq: { to_user_id: userId, is_read: false }
  }).then(function(data) {
    return data ? data.length : 0;
  }).catch(function() { return 0; });
}

/**
 * 标记已读
 */
function markAsRead(notificationId) {
  return api.update('notifications', { eq: { id: notificationId } }, { is_read: true });
}

/**
 * 全部标记已读
 */
function markAllAsRead() {
  var userId = authToken.getCurrentUserId();
  if (!userId) return Promise.resolve();
  return api.update('notifications', { eq: { to_user_id: userId, is_read: false } }, { is_read: true });
}

/**
 * 回复通知
 */
function addReply(notificationId, progressEntryId, taskId, content, repliedToUser) {
  var fromUserId = authToken.getCurrentUserId();
  var fromUsername = authToken.getAuthToken()?.username || '未知';
  if (!fromUserId || !content.trim()) return Promise.reject(new Error('参数错误'));

  var replyId = uuid();
  var now = dateUtil.toISOString();

  // 写入回复
  return api.insert('mention_replies', {
    id: replyId, notification_id: notificationId,
    progress_entry_id: progressEntryId,
    from_user_id: fromUserId, content: content.trim()
  }).then(function() {
    // 更新 reply_count
    return api.single('notifications', {
      select: 'reply_count', eq: { id: notificationId }
    }).then(function(current) {
      var count = (current && current.reply_count) || 0;
      return api.update('notifications', { eq: { id: notificationId } }, {
        reply_count: count + 1, is_read: true
      });
    });
  }).then(function() {
    // 同时写入 progress_entry，格式与 Web 端一致
    var entryId = uuid();
    var replyNote = fromUsername + ' 回复了 @' + (repliedToUser || '用户') + ': ' + content.trim();
    return api.insert('progress_entries', {
      id: entryId, task_id: taskId, timestamp: now,
      progress: 0, note: replyNote, username: fromUsername
    }).then(function() {
      // 处理回复内容中的 @提及
      var mentions = mentionsUtil.parseMentions(content);
      if (mentions.length > 0) {
        return api.select('user_roles', { select: 'user_id,username' }).then(function(users) {
          var userMap = {};
          (users || []).forEach(function(u) {
            if (u.username) {
              userMap[u.username.toLowerCase()] = u.user_id;
              userMap[u.username] = u.user_id;
            }
          });
          var resolved = mentionsUtil.resolveMentions(mentions, userMap);
          var mentionPromises = [];
          resolved.forEach(function(mention) {
            if (mention.userId !== fromUserId) {
              mentionPromises.push(api.insert('notifications', {
                id: uuid(),
                from_user_id: fromUserId,
                to_user_id: mention.userId,
                task_id: taskId,
                progress_entry_id: entryId,
                note: content.trim(),
                mentioned_username: mention.username
              }));
            }
          });
          return Promise.all(mentionPromises);
        });
      }
    });
  });
}

module.exports = {
  fetchNotifications, fetchMyMentions, getUnreadCount,
  markAsRead, markAllAsRead, addReply
};
