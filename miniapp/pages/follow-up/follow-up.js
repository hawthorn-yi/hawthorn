const taskService = require('../../services/tasks.js');
const authToken = require('../../utils/auth-token.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: { tasks: [], pendingCount: 0, dueSoonCount: 0, overdueCount: 0, loading: true },

  onLoad() { this.loadData(); },
  onShow() { if (!this.data.loading) this.loadData(); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      var userId = authToken.getCurrentUserId();
      var tasks = result.tasks.filter(function(t) {
        return t.assignee_id === userId && t.status !== 'completed' && t.status !== 'terminated';
      });

      tasks.forEach(function(t) {
        var cat = result.categories.find(function(c) { return c.id === t.category; });
        t.categoryName = cat ? cat.name : t.category;
        t.categoryColor = cat ? cat.color : '#94A3B8';
      });

      var overdueCount = tasks.filter(function(t) { return t.status === 'overdue'; }).length;
      var dueSoonCount = tasks.filter(function(t) {
        if (!t.deadline || t.status === 'overdue') return false;
        var days = dateUtil.daysUntilDeadline(t.deadline);
        return days <= 3 && days >= 0;
      }).length;

      that.setData({ tasks: tasks, pendingCount: tasks.length, dueSoonCount: dueSoonCount, overdueCount: overdueCount, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  onTaskTap(e) { wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.detail.taskId }); }
});
