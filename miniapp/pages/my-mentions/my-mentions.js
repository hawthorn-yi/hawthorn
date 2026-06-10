const notifService = require('../../services/notifications.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: { mentions: [], filteredMentions: [], mentionedUsers: [], selectedUser: '', loading: true },

  onLoad() { this.loadData(); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return notifService.fetchMyMentions().then(function(data) {
      data.forEach(function(m) { m.relativeTime = dateUtil.relativeTime(m.created_at); });
      // 提取被@的用户列表
      var usersMap = {};
      data.forEach(function(m) {
        if (!usersMap[m.to_user_id]) usersMap[m.to_user_id] = { to_user_id: m.to_user_id, to_username: m.to_username };
      });
      that.setData({ mentions: data, filteredMentions: data, mentionedUsers: Object.values(usersMap), loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  onFilterUser(e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ selectedUser: id });
    if (!id) {
      this.setData({ filteredMentions: this.data.mentions });
    } else {
      this.setData({ filteredMentions: this.data.mentions.filter(function(m) { return m.to_user_id === id; }) });
    }
  },

  onMentionTap(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.taskId });
  }
});
