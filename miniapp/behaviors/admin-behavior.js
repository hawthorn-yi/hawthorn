/**
 * 管理员权限检查 Behavior
 * 在仅管理员可访问的页面中引入
 */
module.exports = Behavior({
  attached() {
    const authToken = require('../utils/auth-token.js');
    if (!authToken.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    if (!authToken.isAdmin()) {
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
      wx.showToast({ title: '无管理员权限', icon: 'none' });
      return;
    }
    this.setData({ currentUser: authToken.getAuthToken() });
  },

  methods: {
    checkAdmin() {
      const authToken = require('../utils/auth-token.js');
      return authToken.isAdmin();
    }
  }
});
