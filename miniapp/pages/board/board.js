const taskService = require('../../services/tasks.js');
const statusUtil = require('../../utils/status.js');

Page({
  data: { groups: [], loading: true },

  onLoad() { this.loadData(); },
  onShow() { if (!this.data.loading) this.loadData(); },
  onPullDownRefresh() { this.loadData().then(function() { wx.stopPullDownRefresh(); }); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      var statusMap = { active: { text: '进行中', cls: 'badge-primary', style: 'background-color:#3B82F622;color:#3B82F6' }, completed: { text: '已完成', cls: 'badge-success', style: 'background-color:#10B98122;color:#10B981' }, overdue: { text: '已逾期', cls: 'badge-danger', style: 'background-color:#F43F5E22;color:#F43F5E' }, terminated: { text: '已终止', cls: 'badge-warning', style: 'background-color:#F59E0B22;color:#F59E0B' } };

      var groups = result.categories.map(function(cat) {
        var catTasks = result.tasks.filter(function(t) { return t.category === cat.id; });
        catTasks.forEach(function(t) {
          var si = statusMap[t.status] || statusMap.active;
          t.statusText = si.text; t.statusClass = si.cls; t.statusStyle = si.style;
          t.progressColor = t.progress >= 100 ? '#10B981' : t.status === 'overdue' ? '#F43F5E' : '#3B82F6';
        });
        return { id: cat.id, name: cat.name, color: cat.color, tasks: catTasks, collapsed: false };
      });
      that.setData({ groups: groups, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  toggleGroup(e) {
    var id = e.currentTarget.dataset.id;
    var groups = this.data.groups;
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id === id) { groups[i].collapsed = !groups[i].collapsed; break; }
    }
    this.setData({ groups: groups });
  },

  onTaskTap(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  }
});
