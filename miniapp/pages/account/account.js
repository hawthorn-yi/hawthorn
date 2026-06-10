const authService = require('../../services/auth.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: { oldPassword: '', newPassword: '', confirmPassword: '', loading: false },

  onOldPasswordInput(e) { this.setData({ oldPassword: e.detail.value }); },
  onNewPasswordInput(e) { this.setData({ newPassword: e.detail.value }); },
  onConfirmPasswordInput(e) { this.setData({ confirmPassword: e.detail.value }); },

  onChangePassword() {
    var that = this;
    var d = that.data;
    if (!d.oldPassword) { wx.showToast({ title: '请输入原密码', icon: 'none' }); return; }
    if (d.newPassword.length < 4) { wx.showToast({ title: '新密码至少4位', icon: 'none' }); return; }
    if (d.newPassword !== d.confirmPassword) { wx.showToast({ title: '两次密码不一致', icon: 'none' }); return; }

    var userId = authToken.getCurrentUserId();
    that.setData({ loading: true });
    authService.changePassword(userId, d.oldPassword, d.newPassword).then(function() {
      that.setData({ loading: false });
      wx.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 1500);
    }).catch(function(err) {
      that.setData({ loading: false });
      wx.showToast({ title: err.message, icon: 'none' });
    });
  }
});
