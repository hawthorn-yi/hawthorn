const taskService = require('../../services/tasks.js');
const authService = require('../../services/auth.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: { isAdmin: false, showConfirm: false, confirmTitle: '', confirmMessage: '', confirmAction: null },

  onLoad() { this.setData({ isAdmin: authToken.isAdmin() }); },

  onExportJSON() {
    var that = this;
    wx.showLoading({ title: '导出中...' });
    taskService.fetchAllData().then(function(result) {
      wx.hideLoading();
      var json = taskService.exportData(result.tasks, result.categories);
      var fs = wx.getFileSystemManager();
      var filePath = wx.env.USER_DATA_PATH + '/项目进度数据_' + new Date().toISOString().split('T')[0] + '.json';
      fs.writeFileSync(filePath, json, 'utf8');
      wx.shareFileMessage({
        filePath: filePath,
        fail: function() { wx.openDocument({ filePath: filePath }); }
      });
    }).catch(function() { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }); });
  },

  onImportJSON() {
    var that = this;
    wx.chooseMessageFile({
      count: 1, type: 'file',
      success: function(res) {
        var filePath = res.tempFiles[0].path;
        var fs = wx.getFileSystemManager();
        var json = fs.readFileSync(filePath, 'utf8');
        wx.showLoading({ title: '导入中...' });
        taskService.importData(json).then(function() {
          wx.hideLoading();
          wx.showToast({ title: '导入成功', icon: 'success' });
        }).catch(function(err) {
          wx.hideLoading();
          wx.showToast({ title: err.message || '导入失败', icon: 'none' });
        });
      }
    });
  },

  onClearData() {
    this.setData({ showConfirm: true, confirmTitle: '清除数据', confirmMessage: '确定清除所有数据吗？此操作不可撤销！', confirmAction: 'clear' });
  },

  onConfirmAction() {
    var that = this;
    that.hideConfirm();
    if (that.data.confirmAction === 'clear') {
      wx.showLoading({ title: '清除中...' });
      taskService.clearAllData().then(function() {
        wx.hideLoading();
        wx.showToast({ title: '已清除', icon: 'success' });
      }).catch(function() { wx.hideLoading(); wx.showToast({ title: '操作失败', icon: 'none' }); });
    }
  },

  hideConfirm() { this.setData({ showConfirm: false }); },

  onLogout() {
    wx.showModal({ title: '退出登录', content: '确定退出当前账号吗？', success: function(res) {
      if (res.confirm) authService.logout();
    }});
  },

  goAdmin() { wx.navigateTo({ url: '/pages/admin/admin' }); },
  goAccount() { wx.navigateTo({ url: '/pages/account/account' }); },
  goFollowUp() { wx.navigateTo({ url: '/pages/follow-up/follow-up' }); },
  goMentions() { wx.navigateTo({ url: '/pages/mentions/mentions' }); },
  goMyMentions() { wx.navigateTo({ url: '/pages/my-mentions/my-mentions' }); },
  goAttachments() { wx.navigateTo({ url: '/pages/attachments/attachments' }); }
});
