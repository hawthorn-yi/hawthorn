/**
 * 日期格式化工具
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {string|Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
function formatDateTime(date) {
  const d = new Date(date);
  return formatDate(d) + ' ' + formatTime(d);
}

/**
 * 格式化时间为 HH:mm
 * @param {Date} d
 * @returns {string}
 */
function formatTime(d) {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return hours + ':' + minutes;
}

/**
 * 相对时间（刚刚/X分钟前/X小时前/X天前）
 * @param {string|Date} date
 * @returns {string}
 */
function relativeTime(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return minutes + '分钟前';
  if (hours < 24) return hours + '小时前';
  if (days < 30) return days + '天前';
  if (days < 365) return Math.floor(days / 30) + '个月前';
  return Math.floor(days / 365) + '年前';
}

/**
 * 判断日期是否已过期
 * @param {string} deadline - 截止日期字符串
 * @returns {boolean}
 */
function isOverdue(deadline) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

/**
 * 计算距截止日期的天数
 * @param {string} deadline
 * @returns {number} 正数=还有X天，负数=已逾期X天
 */
function daysUntilDeadline(deadline) {
  if (!deadline) return Infinity;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
function today() {
  return formatDate(new Date());
}

/**
 * ISO 格式字符串
 * @returns {string}
 */
function toISOString() {
  return new Date().toISOString();
}

module.exports = {
  formatDate,
  formatDateTime,
  relativeTime,
  isOverdue,
  daysUntilDeadline,
  today,
  toISOString
};
