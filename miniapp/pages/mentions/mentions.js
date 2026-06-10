const notifService = require('../../services/notifications.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: { notifications: [], loading: true, unreadCount: 0, replyingTo: null, replyingUsername: '', replyContent: '' },

  onLoad() { this.loadData(); },
  onShow() { if (!this.data.loading) this.loadData(); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return notifService.fetchNotifications().then(function(notifs) {
      notifs.forEach(function(n) { n.relativeTime = dateUtil.relativeTime(n.created_at); });
      var unread = notifs.filter(function(n) { return !n.is_read; }).length;
      that.setData({ notifications: notifs, unreadCount: unread, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  onNotifTap(e) {
    var idx = e.currentTarget.dataset.index;
    var notif = this.data.notifications[idx];
    if (!notif) return;

    // 标记已读
    if (!notif.is_read) {
      notifService.markAsRead(notif.id).then(function() {});
    }

    // 显示回复框
    this.setData({ replyingTo: notif, replyingUsername: notif.from_username, replyContent: '' });
  },

  onMarkAllRead() {
    var that = this;
    notifService.markAllAsRead().then(function() { that.loadData(); });
  },

  onReplyInput(e) { this.setData({ replyContent: e.detail.value }); },

  onSendReply() {
    var that = this;
    var content = that.data.replyContent.trim();
    var notif = that.data.replyingTo;
    if (!content || !notif) return;

    wx.showLoading({ title: '发送中...' });
    notifService.addReply(notif.id, notif.progress_entry_id, notif.task_id, content).then(function() {
      wx.hideLoading();
      that.setData({ replyingTo: null, replyContent: '' });
      that.loadData();
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '发送失败', icon: 'none' });
    });
  }
});
