const auth = require('../../services/auth.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    loading: false
  },

  onLoad() {
    // 已登录则跳转首页
    if (authToken.isLoggedIn()) {
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onLogin() {
    const { username, password, loading } = this.data;
    if (loading) return;

    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    auth.loginUser(username.trim(), password).then(user => {
      const app = getApp();
      if (app) app.onLogin(user);
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none', duration: 2500 });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
