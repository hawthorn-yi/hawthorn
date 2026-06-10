const usersService = require('../../services/users.js');
const dateUtil = require('../../utils/date.js');
const behaviors = require('../../behaviors/admin-behavior.js');

Page({
  behaviors: [behaviors],

  data: { users: [], loading: true, adminCount: 0, activeCount: 0 },

  onLoad() { this.loadData(); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    usersService.fetchAllUsers().then(function(users) {
      users.forEach(function(u) {
        if (u.created_at) u.created_at = dateUtil.formatDate(u.created_at);
      });
      var adminCount = users.filter(function(u) { return u.role === 'admin'; }).length;
      var activeCount = users.filter(function(u) { return u.is_approved; }).length;
      that.setData({ users: users, adminCount: adminCount, activeCount: activeCount, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  onToggleRole(e) {
    var id = e.currentTarget.dataset.id;
    var role = e.currentTarget.dataset.role;
    var newRole = role === 'admin' ? 'user' : 'admin';
    var that = this;
    usersService.updateUserRole(id, newRole).then(function() {
      wx.showToast({ title: '更新成功', icon: 'success' });
      that.loadData();
    });
  },

  onToggleApproval(e) {
    var id = e.currentTarget.dataset.id;
    var approved = e.currentTarget.dataset.approved;
    var that = this;
    usersService.updateUserApproval(id, !approved).then(function() {
      wx.showToast({ title: '更新成功', icon: 'success' });
      that.loadData();
    });
  },

  onResetPassword(e) {
    var id = e.currentTarget.dataset.id;
    wx.showModal({ title: '重置密码', editable: true, placeholderText: '输入新密码',
      success: function(res) {
        if (res.confirm && res.content && res.content.length >= 4) {
          usersService.resetPassword(id, res.content).then(function() {
            wx.showToast({ title: '重置成功', icon: 'success' });
          });
        } else if (res.confirm) {
          wx.showToast({ title: '密码至少4位', icon: 'none' });
        }
      }
    });
  },

  onDeleteUser(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    wx.showModal({ title: '删除用户', content: '确定删除用户 ' + name + ' 吗？', confirmColor: '#F43F5E',
      success: function(res) {
        if (res.confirm) {
          usersService.deleteUser(id).then(function() {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadData();
          }.bind(this));
        }
      }.bind(this)
    });
  }
});
