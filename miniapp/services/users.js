/**
 * 用户管理服务（管理员）
 */
const api = require('./api.js');

function fetchAllUsers() {
  return api.select('app_users', {
    select: '*', order: 'created_at', ascending: false
  }).then(function(data) {
    return (data || []).map(function(u) {
      return {
        id: u.id, username: u.username, role: u.role,
        is_approved: u.is_approved, created_at: u.created_at, last_login: u.last_login
      };
    });
  });
}

function updateUserRole(userId, role) {
  return api.update('app_users', { eq: { id: userId } }, { role: role });
}

function updateUserApproval(userId, isApproved) {
  return api.update('app_users', { eq: { id: userId } }, { is_approved: isApproved });
}

function deleteUser(userId) {
  return api.remove('app_users', { eq: { id: userId } });
}

function resetPassword(userId, newPassword) {
  var hashPassword = require('../utils/password.js').hashPassword;
  return hashPassword(newPassword).then(function(hash) {
    return api.update('app_users', { eq: { id: userId } }, { password_hash: hash });
  });
}

function changePassword(userId, oldPassword, newPassword) {
  var hashPassword = require('../utils/password.js').hashPassword;
  return api.single('app_users', {
    select: 'password_hash', eq: { id: userId }
  }).then(function(data) {
    if (!data) throw new Error('用户不存在');
    return hashPassword(oldPassword).then(function(oldHash) {
      if (data.password_hash !== oldHash) throw new Error('原密码不正确');
      return hashPassword(newPassword).then(function(newHash) {
        return api.update('app_users', { eq: { id: userId } }, { password_hash: newHash });
      });
    });
  });
}

/**
 * 获取所有用户（简单列表，用于成员选择等）
 */
function fetchUserList() {
  return api.select('app_users', { select: 'id,username,role,is_approved' })
    .then(function(data) {
      return (data || []).filter(function(u) { return u.is_approved; });
    });
}

module.exports = {
  fetchAllUsers, updateUserRole, updateUserApproval,
  deleteUser, resetPassword, changePassword, fetchUserList
};
