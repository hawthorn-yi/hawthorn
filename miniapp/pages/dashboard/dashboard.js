const taskService = require('../../services/tasks.js');
const statusUtil = require('../../utils/status.js');
const dateUtil = require('../../utils/date.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: {
    tasks: [],
    filteredTasks: [],
    categories: [],
    stats: { all: 0, active: 0, completed: 0, overdue: 0 },
    filter: 'all',
    searchQuery: '',
    loading: true,
    emptyMessage: '暂无任务',

    // 新建任务
    showAdd: false,
    newTask: { name: '', category: 'new-product', deadline: '', progress: 0, note: '' },
    submitting: false,

    // 操作弹窗
    showActionSheet: false,
    actionTaskId: '',
    actionTaskName: '',
    actionTaskStatus: '',

    // 确认弹窗
    showConfirm: false,
    confirmTitle: '',
    confirmMessage: '',
    confirmText: '确认',
    confirmColor: '#3B82F6',
    confirmAction: null
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (!this.data.loading) this.loadData();
    // 刷新未读数
    var app = getApp();
    if (app && app.fetchUnreadCount) app.fetchUnreadCount();
  },

  onPullDownRefresh() {
    this.loadData().then(function() { wx.stopPullDownRefresh(); });
  },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      taskService.setUserMap(result.userMap);

      // 为每个任务添加分类名称和颜色
      var tasks = result.tasks.map(function(t) {
        var cat = result.categories.find(function(c) { return c.id === t.category; });
        t.categoryName = cat ? cat.name : t.category;
        t.categoryColor = cat ? cat.color : '#94A3B8';
        return t;
      });

      that.setData({
        tasks: tasks,
        categories: result.categories,
        loading: false
      });
      that.applyFilter();
    }).catch(function(err) {
      that.setData({ loading: false });
      wx.showToast({ title: '加载数据失败', icon: 'none' });
    });
  },

  applyFilter() {
    var tasks = this.data.tasks;
    var filter = this.data.filter;
    var query = this.data.searchQuery.toLowerCase();

    var filtered = tasks;
    if (filter === 'in-progress') filtered = filtered.filter(function(t) { return t.status === 'active'; });
    else if (filter === 'completed') filtered = filtered.filter(function(t) { return t.status === 'completed'; });
    else if (filter === 'overdue') filtered = filtered.filter(function(t) { return t.status === 'overdue'; });

    if (query) {
      filtered = filtered.filter(function(t) {
        return t.name.toLowerCase().indexOf(query) !== -1 ||
               t.categoryName.toLowerCase().indexOf(query) !== -1 ||
               (t.assignee_username && t.assignee_username.toLowerCase().indexOf(query) !== -1);
      });
    }

    // 排序
    filtered.sort(function(a, b) { return a.sort_order - b.sort_order; });

    var stats = statusUtil.computeStats(tasks);
    var emptyMsg = filter === 'all' ? '暂无任务' : '暂无' + statusUtil.getStatusText(
      filter === 'in-progress' ? 'active' : filter
    ) + '的任务';

    this.setData({ filteredTasks: filtered, stats: stats, emptyMessage: emptyMsg });
  },

  setFilter(e) {
    var filter = e.currentTarget.dataset.filter;
    this.setData({ filter: filter });
    this.applyFilter();
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
    this.applyFilter();
  },

  onSearchClear() {
    this.setData({ searchQuery: '' });
    this.applyFilter();
  },

  // 点击任务卡片
  onTaskTap(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.detail.taskId });
  },

  // 切换完成状态
  onToggleComplete(e) {
    var that = this;
    var taskId = e.detail.taskId;
    var task = this.data.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    wx.showLoading({ title: '处理中...' });
    taskService.toggleComplete(taskId, task.progress).then(function(result) {
      wx.hideLoading();
      that.loadData();
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  // 更多操作
  onTaskMore(e) {
    var taskId = e.detail.taskId;
    var task = this.data.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
    this.setData({
      showActionSheet: true,
      actionTaskId: taskId,
      actionTaskName: task.name,
      actionTaskStatus: task.status
    });
  },

  hideActionSheet() { this.setData({ showActionSheet: false }); },

  onViewDetail() {
    this.hideActionSheet();
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + this.data.actionTaskId });
  },

  onMoveUp() { this.doMove('up'); },
  onMoveDown() { this.doMove('down'); },
  onMoveTop() { this.doMove('top'); },

  doMove(direction) {
    var that = this;
    that.hideActionSheet();
    wx.showLoading({ title: '处理中...' });
    taskService.moveTask(that.data.actionTaskId, direction, that.data.tasks).then(function(newTasks) {
      wx.hideLoading();
      that.setData({ tasks: newTasks });
      that.applyFilter();
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '移动失败', icon: 'none' });
    });
  },

  onTerminate() {
    this.hideActionSheet();
    this.setData({
      showConfirm: true, confirmTitle: '终止任务',
      confirmMessage: '确定要终止这个任务吗？终止后可以恢复。',
      confirmText: '终止', confirmColor: '#F59E0B',
      confirmAction: 'terminate'
    });
  },

  onRestore() {
    this.hideActionSheet();
    this.setData({
      showConfirm: true, confirmTitle: '恢复任务',
      confirmMessage: '确定要恢复这个任务吗？',
      confirmText: '恢复', confirmColor: '#3B82F6',
      confirmAction: 'restore'
    });
  },

  onDeleteTask() {
    this.hideActionSheet();
    this.setData({
      showConfirm: true, confirmTitle: '删除任务',
      confirmMessage: '删除后无法恢复，确定要删除吗？',
      confirmText: '删除', confirmColor: '#F43F5E',
      confirmAction: 'delete'
    });
  },

  onConfirmAction() {
    var that = this;
    var action = that.data.confirmAction;
    var taskId = that.data.actionTaskId;
    that.hideConfirm();
    wx.showLoading({ title: '处理中...' });

    var promise;
    if (action === 'terminate') {
      promise = taskService.terminateTask(taskId);
    } else if (action === 'restore') {
      var task = that.data.tasks.find(function(t) { return t.id === taskId; });
      promise = taskService.restoreTask(taskId, task ? task.progress : 0);
    } else if (action === 'delete') {
      promise = taskService.deleteTask(taskId);
    }
    if (promise) {
      promise.then(function() {
        wx.hideLoading();
        that.loadData();
      }).catch(function() {
        wx.hideLoading();
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
    }
  },

  hideConfirm() { this.setData({ showConfirm: false }); },

  // 新建任务
  showAddDialog() {
    this.setData({
      showAdd: true,
      newTask: { name: '', category: 'new-product', deadline: '', progress: 0, note: '' }
    });
  },

  hideAddDialog() { this.setData({ showAdd: false }); },

  onNewNameInput(e) { this.setData({ 'newTask.name': e.detail.value }); },
  onNewCategorySelect(e) { this.setData({ 'newTask.category': e.detail.categoryId }); },
  onNewDeadlineChange(e) { this.setData({ 'newTask.deadline': e.detail.value }); },
  onNewProgressChange(e) { this.setData({ 'newTask.progress': e.detail.value }); },
  onNewNoteInput(e) { this.setData({ 'newTask.note': e.detail.value }); },

  onAddTask() {
    var that = this;
    var task = that.data.newTask;
    if (!task.name.trim()) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' });
      return;
    }

    that.setData({ submitting: true });
    var maxOrder = that.data.tasks.reduce(function(max, t) { return Math.max(max, t.sort_order); }, -1);

    taskService.addTask({
      name: task.name.trim(), category: task.category,
      createdDate: dateUtil.today(), deadline: task.deadline,
      progress: task.progress, note: task.note,
      sortOrder: maxOrder + 1
    }).then(function() {
      that.setData({ showAdd: false, submitting: false });
      wx.showToast({ title: '创建成功', icon: 'success' });
      that.loadData();
    }).catch(function(err) {
      that.setData({ submitting: false });
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    });
  }
});
