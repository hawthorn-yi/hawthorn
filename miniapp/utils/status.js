/**
 * 任务状态计算工具
 */

/**
 * 根据进度和截止日期计算任务状态
 * @param {number} progress - 进度 0-100
 * @param {string} status - 当前状态
 * @param {string} deadline - 截止日期
 * @returns {string} 'active' | 'completed' | 'overdue' | 'terminated'
 */
function computeStatus(progress, status, deadline) {
  // 已终止的任务保持终止状态
  if (status === 'terminated') return 'terminated';

  // 已完成
  if (progress >= 100) return 'completed';

  // 已逾期（有截止日期且已过期）
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate < today) return 'overdue';
  }

  return 'active';
}

/**
 * 获取状态显示文本
 * @param {string} status
 * @returns {string}
 */
function getStatusText(status) {
  const map = {
    'active': '进行中',
    'completed': '已完成',
    'overdue': '已逾期',
    'terminated': '已终止'
  };
  return map[status] || status;
}

/**
 * 获取状态对应的样式类名
 * @param {string} status
 * @returns {string}
 */
function getStatusClass(status) {
  const map = {
    'active': 'badge-primary',
    'completed': 'badge-success',
    'overdue': 'badge-danger',
    'terminated': 'badge-warning'
  };
  return map[status] || '';
}

/**
 * 获取状态对应颜色
 * @param {string} status
 * @returns {string} hex 颜色值
 */
function getStatusColor(status) {
  const map = {
    'active': '#3B82F6',
    'completed': '#10B981',
    'overdue': '#F43F5E',
    'terminated': '#F59E0B'
  };
  return map[status] || '#94A3B8';
}

/**
 * 计算筛选后的任务统计
 * @param {Array} tasks
 * @returns {Object} { all, active, completed, overdue }
 */
function computeStats(tasks) {
  const all = tasks.length;
  const active = tasks.filter(t => t.status === 'active').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => t.status === 'overdue').length;
  return { all, active, completed, overdue };
}

module.exports = {
  computeStatus,
  getStatusText,
  getStatusClass,
  getStatusColor,
  computeStats
};
