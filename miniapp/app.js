App({
  globalData: {
    user: null,       // { id, username, role, is_approved, created_at }
    unreadCount: 0    // 未读通知数
  },

  onLaunch() {
    // 检查登录状态
    const authToken = require('./utils/auth-token.js');
    const user = authToken.getAuthToken();
    if (user) {
      this.globalData.user = user;
      this.fetchUnreadCount();
    }
  },

  // 获取未读通知数
  fetchUnreadCount() {
    if (!this.globalData.user) return;
    const notifications = require('./services/notifications.js');
    notifications.getUnreadCount(this.globalData.user.id).then(count => {
      this.globalData.unreadCount = count;
      if (count > 0) {
        wx.setTabBarBadge({ index: 0, text: String(count) });
      } else {
        wx.removeTabBarBadge({ index: 0 });
      }
    }).catch(() => {});
  },

  // 登录成功后调用
  onLogin(user) {
    this.globalData.user = user;
    this.fetchUnreadCount();
  },

  // 登出
  onLogout() {
    this.globalData.user = null;
    this.globalData.unreadCount = 0;
    wx.removeTabBarBadge({ index: 0 });
  }
});
