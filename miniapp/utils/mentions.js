/**
 * @提及解析工具
 * 从 React 版本直接移植，去除 TypeScript 类型
 * 支持中文（含空格）和英文用户名
 */

// 正则：中文模式（允许中文之间有空格）或 英文模式（无空格）
var MENTION_REGEX = /@((?:[\u4e00-\u9fff\u3400-\u4dbf]+(?: [\u4e00-\u9fff\u3400-\u4dbf]+)*)|(?:[\w]+))/g;

/**
 * 从文本中提取所有 @username 提及
 * @param {string} text
 * @returns {Array<{username: string, index: number}>}
 */
function parseMentions(text) {
  var mentions = [];
  var seen = {};

  // 重置正则状态
  MENTION_REGEX.lastIndex = 0;
  var match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    var username = match[1];
    if (!seen[username]) {
      seen[username] = true;
      mentions.push({ username: username, index: match.index });
    }
  }
  return mentions;
}

/**
 * 构建不区分大小写的 username → userId 映射
 * @param {Array<{id: string, username: string}>} users
 * @returns {Object} lowercase username → userId
 */
function buildUserMap(users) {
  var map = {};
  for (var i = 0; i < users.length; i++) {
    map[users[i].username.toLowerCase()] = users[i].id;
  }
  return map;
}

/**
 * 解析提及并匹配有效用户
 * 对含空格的中文用户名，先尝试完整匹配，再逐步截断
 * 例如 "王 小明 你好" → 尝试 "王 小明 你好", 然后 "王 小明", 然后 "王"
 * @param {Array<{username: string, index: number}>} mentions
 * @param {Object} userMap - buildUserMap 返回的映射
 * @returns {Array<{username: string, userId: string}>}
 */
function resolveMentions(mentions, userMap) {
  var resolved = [];
  var seenIds = {};

  for (var i = 0; i < mentions.length; i++) {
    var m = mentions[i];
    var username = m.username;

    // 直接查找
    var userId = userMap[username.toLowerCase()];
    if (userId && !seenIds[userId]) {
      seenIds[userId] = true;
      resolved.push({ username: username, userId: userId });
      continue;
    }

    // 含空格的中文用户名：逐步截断尝试
    if (username.indexOf(' ') !== -1) {
      var parts = username.split(' ');
      for (var j = parts.length - 1; j >= 1; j--) {
        var shorter = parts.slice(0, j).join(' ');
        var shorterId = userMap[shorter.toLowerCase()];
        if (shorterId && !seenIds[shorterId]) {
          seenIds[shorterId] = true;
          resolved.push({ username: shorter, userId: shorterId });
          break;
        }
      }
    }
  }
  return resolved;
}

module.exports = {
  parseMentions,
  buildUserMap,
  resolveMentions
};
