/**
 * 认证检查 Behavior
 * 在需要登录的页面中引入，自动检查登录状态
 */
module.exports = Behavior({
  attached() {
    const authToken = require('../utils/auth-token.js');
    if (!authToken.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    const user = authToken.getAuthToken();
    this.setData({ currentUser: user });
  },

  methods: {
    // 检查登录状态（用于 onShow 中调用）
    checkAuth() {
      const authToken = require('../utils/auth-token.js');
      if (!authToken.isLoggedIn()) {
        wx.redirectTo({ url: '/pages/login/login' });
        return false;
      }
      return true;
    },

    // 获取当前用户
    getCurrentUser() {
      const authToken = require('../utils/auth-token.js');
      return authToken.getAuthToken();
    }
  }
});
