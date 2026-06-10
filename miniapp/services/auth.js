/**
 * 认证服务
 * 移植自 lib/auth.ts，使用 Supabase REST API
 */
const api = require('./api.js');
const { hashPassword } = require('../utils/password.js');
const { saveAuthToken, getAuthToken, clearAuthToken } = require('../utils/auth-token.js');
const { uuid } = require('../utils/id.js');
const dateUtil = require('../utils/date.js');

/**
 * 用户登录
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} user
 */
function loginUser(username, password) {
  return hashPassword(password).then(passwordHash => {
    // 查询用户
    return api.single('app_users', {
      select: '*',
      eq: { username: username }
    }).then(data => {
      // 验证密码
      if (data.password_hash !== passwordHash) {
        throw new Error('用户名或密码错误');
      }

      // 验证审批状态
      if (!data.is_approved) {
        throw new Error('账户尚未通过审批，请联系管理员');
      }

      // 更新 last_login
      api.update('app_users', { eq: { id: data.id } }, {
        last_login: dateUtil.toISOString()
      }).catch(() => {}); // 不阻塞登录流程

      const user = {
        id: data.id,
        username: data.username,
        role: data.role,
        is_approved: data.is_approved,
        created_at: data.created_at,
        last_login: dateUtil.toISOString()
      };

      saveAuthToken(user);
      return user;
    });
  }).catch(err => {
    if (err.message === '未找到记录') {
      throw new Error('用户名或密码错误');
    }
    throw err;
  });
}

/**
 * 用户注册
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} user
 */
function registerUser(username, password) {
  if (username.length < 3) return Promise.reject(new Error('用户名至少需要3个字符'));
  if (password.length < 4) return Promise.reject(new Error('密码至少需要4个字符'));

  return hashPassword(password).then(passwordHash => {
    const userId = uuid();

    return api.insert('app_users', {
      id: userId,
      username: username,
      password_hash: passwordHash,
      role: 'user',
      is_approved: true,
      created_at: dateUtil.toISOString()
    }).then(() => {
      const user = {
        id: userId,
        username: username,
        role: 'user',
        is_approved: true,
        created_at: dateUtil.toISOString()
      };
      saveAuthToken(user);
      return user;
    }).catch(err => {
      const msg = err.message || '';
      if (msg.indexOf('duplicate') !== -1 || msg.indexOf('unique') !== -1) {
        throw new Error('该用户名已被注册');
      }
      throw new Error('注册失败: ' + msg);
    });
  });
}

/**
 * 获取所有用户（管理员）
 * @returns {Promise<Array>}
 */
function getAllUsers() {
  return api.select('app_users', {
    select: '*',
    order: 'created_at',
    ascending: false
  }).then(data => {
    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      is_approved: u.is_approved,
      created_at: u.created_at,
      last_login: u.last_login
    }));
  });
}

/**
 * 更新用户角色
 * @param {string} userId
 * @param {string} role - 'admin' | 'user'
 */
function updateUserRole(userId, role) {
  return api.update('app_users', { eq: { id: userId } }, { role: role })
    .catch(err => { throw new Error('更新用户权限失败: ' + err.message); });
}

/**
 * 更新用户审批状态
 * @param {string} userId
 * @param {boolean} isApproved
 */
function updateUserApproval(userId, isApproved) {
  return api.update('app_users', { eq: { id: userId } }, { is_approved: isApproved })
    .catch(err => { throw new Error('更新用户审批状态失败: ' + err.message); });
}

/**
 * 删除用户
 * @param {string} userId
 */
function deleteUser(userId) {
  return api.remove('app_users', { eq: { id: userId } })
    .catch(err => { throw new Error('删除用户失败: ' + err.message); });
}

/**
 * 重置用户密码（管理员）
 * @param {string} userId
 * @param {string} newPassword
 */
function resetUserPassword(userId, newPassword) {
  if (newPassword.length < 4) return Promise.reject(new Error('密码至少需要4个字符'));

  return hashPassword(newPassword).then(newHash => {
    return api.update('app_users', { eq: { id: userId } }, { password_hash: newHash })
      .catch(err => { throw new Error('重置密码失败: ' + err.message); });
  });
}

/**
 * 修改密码
 * @param {string} userId
 * @param {string} oldPassword
 * @param {string} newPassword
 */
function changePassword(userId, oldPassword, newPassword) {
  return api.single('app_users', {
    select: 'password_hash',
    eq: { id: userId }
  }).then(data => {
    if (!data) throw new Error('用户不存在');
    return hashPassword(oldPassword).then(oldHash => {
      if (data.password_hash !== oldHash) {
        throw new Error('原密码不正确');
      }
      return hashPassword(newPassword).then(newHash => {
        return api.update('app_users', { eq: { id: userId } }, { password_hash: newHash })
          .catch(err => { throw new Error('修改密码失败: ' + err.message); });
      });
    });
  });
}

/**
 * 登出
 */
function logout() {
  clearAuthToken();
  const app = getApp();
  if (app) app.onLogout();
  wx.redirectTo({ url: '/pages/login/login' });
}

module.exports = {
  loginUser,
  registerUser,
  getAllUsers,
  updateUserRole,
  updateUserApproval,
  deleteUser,
  resetUserPassword,
  changePassword,
  logout
};
