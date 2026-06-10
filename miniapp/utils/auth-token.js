/**
 * 认证 Token 管理
 * 替代 localStorage → wx.setStorageSync / wx.getStorageSync
 */

const AUTH_KEY = 'project_progress_auth';
const TOKEN_EXPIRE_MS = 30 * 24 * 60 * 60 * 1000; // 30天

/**
 * 保存认证 Token
 * @param {Object} user - { id, username, role, is_approved, created_at }
 */
function saveAuthToken(user) {
  const token = {
    userId: user.id,
    username: user.username,
    role: user.role,
    is_approved: user.is_approved,
    created_at: user.created_at || '',
    timestamp: Date.now()
  };
  wx.setStorageSync(AUTH_KEY, JSON.stringify(token));
}

/**
 * 获取认证 Token（已验证有效性）
 * @returns {Object|null} user 对象或 null
 */
function getAuthToken() {
  try {
    const raw = wx.getStorageSync(AUTH_KEY);
    if (!raw) return null;

    const token = JSON.parse(raw);

    // 检查是否过期
    if (Date.now() - token.timestamp > TOKEN_EXPIRE_MS) {
      clearAuthToken();
      return null;
    }

    return {
      id: token.userId,
      username: token.username,
      role: token.role,
      is_approved: token.is_approved !== undefined ? token.is_approved : true,
      created_at: token.created_at || ''
    };
  } catch (e) {
    clearAuthToken();
    return null;
  }
}

/**
 * 清除认证 Token
 */
function clearAuthToken() {
  wx.removeStorageSync(AUTH_KEY);
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return getAuthToken() !== null;
}

/**
 * 获取当前用户 ID
 * @returns {string|null}
 */
function getCurrentUserId() {
  const user = getAuthToken();
  return user ? user.id : null;
}

/**
 * 检查是否为管理员
 * @returns {boolean}
 */
function isAdmin() {
  const user = getAuthToken();
  return user && user.role === 'admin';
}

module.exports = {
  saveAuthToken,
  getAuthToken,
  clearAuthToken,
  isLoggedIn,
  getCurrentUserId,
  isAdmin
};
