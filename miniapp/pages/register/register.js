const auth = require('../../services/auth.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    loading: false
  },

  onLoad() {
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

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onRegister() {
    const { username, password, confirmPassword, loading } = this.data;
    if (loading) return;

    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (username.trim().length < 3) {
      wx.showToast({ title: '用户名至少需要3个字符', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password.length < 4) {
      wx.showToast({ title: '密码至少需要4个字符', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    auth.registerUser(username.trim(), password).then(user => {
      const app = getApp();
      if (app) app.onLogin(user);
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none', duration: 2500 });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  goLogin() {
    wx.navigateBack();
  }
});
