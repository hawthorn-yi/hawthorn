const taskService = require('../../services/tasks.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: { groupedEntries: [], allEntries: [], loading: true, searchQuery: '' },

  onLoad() { this.loadData(); },
  onShow() { if (!this.data.loading) this.loadData(); },
  onPullDownRefresh() { this.loadData().then(function() { wx.stopPullDownRefresh(); }); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      var taskMap = {};
      result.tasks.forEach(function(t) { taskMap[t.id] = t.name; });

      var allEntries = [];
      result.tasks.forEach(function(t) {
        t.history.forEach(function(h) {
          allEntries.push({
            id: h.id, task_id: t.id, taskName: t.name,
            timestamp: h.timestamp, progress: h.progress,
            note: h.note, username: h.username
          });
        });
      });

      // 按时间倒序
      allEntries.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      that.setData({ allEntries: allEntries, loading: false });
      that.applyFilter();
    }).catch(function() { that.setData({ loading: false }); });
  },

  applyFilter() {
    var entries = this.data.allEntries;
    var query = this.data.searchQuery.toLowerCase();
    if (query) {
      entries = entries.filter(function(e) {
        return e.note.toLowerCase().indexOf(query) !== -1 ||
               e.username.toLowerCase().indexOf(query) !== -1 ||
               e.taskName.toLowerCase().indexOf(query) !== -1;
      });
    }

    // 按天分组
    var grouped = {};
    var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
    entries.forEach(function(e) {
      var d = new Date(e.timestamp);
      var dateStr = dateUtil.formatDate(d);
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, weekday: weekdays[d.getDay()], entries: [] };
      }
      e.time = ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2);
      grouped[dateStr].entries.push(e);
    });

    var arr = Object.values(grouped);
    arr.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    this.setData({ groupedEntries: arr });
  },

  onSearchInput(e) { this.setData({ searchQuery: e.detail.value }); this.applyFilter(); },
  onSearchClear() { this.setData({ searchQuery: '' }); this.applyFilter(); },

  onEntryTap(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.taskId });
  }
});
