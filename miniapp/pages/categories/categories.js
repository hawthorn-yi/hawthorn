const taskService = require('../../services/tasks.js');
const categoryService = require('../../services/categories.js');
const statusUtil = require('../../utils/status.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: { categories: [], loading: true, isAdmin: false, completedCount: 0, overdueCount: 0 },

  onLoad() {
    this.setData({ isAdmin: authToken.isAdmin() });
  },
  onShow() { this.loadData(); },
  onPullDownRefresh() { this.loadData().then(function() { wx.stopPullDownRefresh(); }); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      var statusMap = { active: { text:'进行中',cls:'badge-primary',style:'background-color:#3B82F622;color:#3B82F6' }, completed: { text:'已完成',cls:'badge-success',style:'background-color:#10B98122;color:#10B981' }, overdue: { text:'已逾期',cls:'badge-danger',style:'background-color:#F43F5E22;color:#F43F5E' }, terminated: { text:'已终止',cls:'badge-warning',style:'background-color:#F59E0B22;color:#F59E0B' } };

      var totalCompleted = 0, totalOverdue = 0;
      var cats = result.categories.map(function(cat) {
        var catTasks = result.tasks.filter(function(t) { return t.category === cat.id; });
        catTasks.forEach(function(t) {
          var si = statusMap[t.status] || statusMap.active;
          t.statusText = si.text; t.statusClass = si.cls; t.statusStyle = si.style;
          t.progressColor = t.progress >= 100 ? '#10B981' : t.status === 'overdue' ? '#F43F5E' : '#3B82F6';
        });
        var cc = catTasks.filter(function(t) { return t.status === 'completed'; }).length;
        var oc = catTasks.filter(function(t) { return t.status === 'overdue'; }).length;
        totalCompleted += cc; totalOverdue += oc;
        return { id: cat.id, name: cat.name, color: cat.color, tasks: catTasks, taskCount: catTasks.length, completedCount: cc, overdueCount: oc, collapsed: true };
      });

      that.setData({ categories: cats, completedCount: totalCompleted, overdueCount: totalOverdue, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  toggleCategory(e) {
    var id = e.currentTarget.dataset.id;
    var cats = this.data.categories;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) { cats[i].collapsed = !cats[i].collapsed; break; }
    }
    this.setData({ categories: cats });
  },

  onTaskTap(e) { wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id }); },

  onAddCategory() {
    var that = this;
    wx.showModal({ title: '添加分类', editable: true, placeholderText: '分类名称',
      success: function(res) {
        if (res.confirm && res.content && res.content.trim()) {
          var colors = ['#14B8A6','#3B82F6','#F59E0B','#F43F5E','#8B5CF6','#EC4899'];
          var color = colors[that.data.categories.length % colors.length];
          categoryService.addCategory(res.content.trim(), color).then(function() {
            wx.showToast({ title: '添加成功', icon: 'success' });
            that.loadData();
          });
        }
      }
    });
  }
});
