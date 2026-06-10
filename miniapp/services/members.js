/**
 * 项目成员服务
 */
const api = require('./api.js');
const { uuid } = require('../utils/id.js');

function fetchMembers() {
  return api.select('project_members', { select: '*' });
}

function fetchMembersByTask(taskId) {
  return api.select('project_members', { select: '*', eq: { task_id: taskId } });
}

function addMember(taskId, userId, role) {
  var memberId = uuid();
  return api.insert('project_members', {
    id: memberId, task_id: taskId, user_id: userId, role: role || 'member'
  }).then(function() {
    return { id: memberId, task_id: taskId, user_id: userId, role: role || 'member' };
  });
}

function removeMember(memberId) {
  return api.remove('project_members', { eq: { id: memberId } });
}

function updateMemberRole(memberId, role) {
  return api.update('project_members', { eq: { id: memberId } }, { role: role });
}

module.exports = {
  fetchMembers, fetchMembersByTask, addMember, removeMember, updateMemberRole
};
