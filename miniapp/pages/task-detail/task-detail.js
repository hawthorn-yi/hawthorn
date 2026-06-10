const taskService = require('../../services/tasks.js');
const memberService = require('../../services/members.js');
const attachmentService = require('../../services/attachments.js');
const progressService = require('../../services/progress.js');
const usersService = require('../../services/users.js');
const statusUtil = require('../../utils/status.js');
const dateUtil = require('../../utils/date.js');
const authToken = require('../../utils/auth-token.js');

Page({
  data: {
    taskId: '',
    task: null,
    members: [],
    allUsers: [],
    categories: [],
    loading: true,
    activeTab: 'history',
    statusText: '', statusClass: '', statusStyle: '', progressColor: '',

    // 更新输入
    updateNote: '', updateProgress: 0,

    // 编辑
    showEdit: false, saving: false,
    editData: { name: '', category: '', deadline: '', assignee_id: '', assignee_username: '' }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ taskId: options.id });
      this.loadTask(options.id);
    }
  },

  onShow() {
    if (this.data.taskId && this.data.task) {
      this.loadTask(this.data.taskId);
    }
  },

  loadTask(taskId) {
    var that = this;
    that.setData({ loading: true });

    Promise.all([
      taskService.fetchAllData(),
      memberService.fetchMembersByTask(taskId),
      usersService.fetchUserList()
    ]).then(function(results) {
      var result = results[0];
      var members = results[1];
      var allUsers = results[2];

      var task = result.tasks.find(function(t) { return t.id === taskId; });
      if (!task) {
        that.setData({ loading: false });
        wx.showToast({ title: '任务不存在', icon: 'none' });
        setTimeout(function() { wx.navigateBack(); }, 1500);
        return;
      }

      // 丰富化
      var cat = result.categories.find(function(c) { return c.id === task.category; });
      task.categoryName = cat ? cat.name : task.category;
      task.categoryColor = cat ? cat.color : '#94A3B8';

      // 相对时间
      task.history.forEach(function(h) {
        h.relativeTime = dateUtil.relativeTime(h.timestamp);
      });

      // 附件大小
      task.attachments.forEach(function(a) {
        if (a.size < 1024) a.sizeText = a.size + ' B';
        else if (a.size < 1024*1024) a.sizeText = (a.size/1024).toFixed(1) + ' KB';
        else a.sizeText = (a.size/1024/1024).toFixed(1) + ' MB';
      });

      // 成员丰富化
      var userMap = {};
      result.allUsers.forEach(function(u) { userMap[u.id] = u.username; });
      var enrichedMembers = members.map(function(m) {
        return { id: m.id, user_id: m.user_id, username: userMap[m.user_id] || m.user_id, role: m.role };
      });

      var statusMap = { 'active': { text: '进行中', cls: 'badge-primary', color: '#3B82F6' }, 'completed': { text: '已完成', cls: 'badge-success', color: '#10B981' }, 'overdue': { text: '已逾期', cls: 'badge-danger', color: '#F43F5E' }, 'terminated': { text: '已终止', cls: 'badge-warning', color: '#F59E0B' } };
      var si = statusMap[task.status] || statusMap['active'];

      that.setData({
        task: task, members: enrichedMembers, allUsers: allUsers,
        categories: result.categories, loading: false,
        statusText: si.text, statusClass: si.cls,
        statusStyle: 'background-color:' + si.color + '22;color:' + si.color,
        progressColor: task.progress >= 100 ? '#10B981' : task.status === 'overdue' ? '#F43F5E' : '#3B82F6',
        updateProgress: task.progress
      });
    }).catch(function() {
      that.setData({ loading: false });
    });
  },

  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },

  // 进度滑块
  onProgressChange(e) {
    var val = e.detail.value;
    var that = this;
    taskService.updateTask(that.data.taskId, { progress: val }).then(function() {
      that.loadTask(that.data.taskId);
    });
  },

  // 更新输入
  onUpdateNoteInput(e) { this.setData({ updateNote: e.detail.value }); },
  onUpdateProgressChange(e) { this.setData({ updateProgress: e.detail.value }); },

  onAddUpdate() {
    var that = this;
    var note = that.data.updateNote.trim();
    if (!note) { wx.showToast({ title: '请输入更新内容', icon: 'none' }); return; }

    wx.showLoading({ title: '发送中...' });
    taskService.updateTask(that.data.taskId, {
      progress: that.data.updateProgress,
      note: note
    }).then(function() {
      that.setData({ updateNote: '', updateProgress: that.data.task.progress });
      wx.hideLoading();
      that.loadTask(that.data.taskId);
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '发送失败', icon: 'none' });
    });
  },

  // 附件
  onAddAttachment() {
    var that = this;
    attachmentService.chooseAndUploadFile(that.data.taskId).then(function() {
      wx.showToast({ title: '上传成功', icon: 'success' });
      that.loadTask(that.data.taskId);
    }).catch(function(err) {
      if (err.message !== '未选择文件') {
        wx.showToast({ title: err.message || '上传失败', icon: 'none' });
      }
    });
  },

  onPreviewAttachment(e) {
    var idx = e.currentTarget.dataset.index;
    var att = this.data.task.attachments[idx];
    if (att) attachmentService.previewAttachment(att);
  },

  onRemoveAttachment(e) {
    var that = this;
    var attId = e.currentTarget.dataset.id;
    var attName = e.currentTarget.dataset.name;
    wx.showModal({
      title: '删除附件', content: '确定删除 ' + attName + ' 吗？',
      success: function(res) {
        if (res.confirm) {
          attachmentService.removeAttachment(attId).then(function() {
            that.loadTask(that.data.taskId);
          });
        }
      }
    });
  },

  // 成员
  onAddMember() {
    var that = this;
    var memberIds = that.data.members.map(function(m) { return m.user_id; });
    var available = that.data.allUsers.filter(function(u) { return memberIds.indexOf(u.id) === -1; });

    if (available.length === 0) {
      wx.showToast({ title: '没有可添加的用户', icon: 'none' });
      return;
    }

    wx.showActionSheet({
      itemList: available.map(function(u) { return u.username; }),
      success: function(res) {
        var user = available[res.tapIndex];
        memberService.addMember(that.data.taskId, user.id, 'member').then(function() {
          that.loadTask(that.data.taskId);
        });
      }
    });
  },

  onRemoveMember(e) {
    var that = this;
    var memberId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '移除成员', content: '确定移除该成员吗？',
      success: function(res) {
        if (res.confirm) {
          memberService.removeMember(memberId).then(function() {
            that.loadTask(that.data.taskId);
          });
        }
      }
    });
  },

  // 编辑
  onEditTask() {
    var task = this.data.task;
    this.setData({
      showEdit: true,
      editData: { name: task.name, category: task.category, deadline: task.deadline, assignee_id: task.assignee_id || '', assignee_username: task.assignee_username || '' }
    });
  },

  hideEditDialog() { this.setData({ showEdit: false }); },
  onEditName(e) { this.setData({ 'editData.name': e.detail.value }); },
  onEditCategory(e) { this.setData({ 'editData.category': e.detail.categoryId }); },
  onEditDeadline(e) { this.setData({ 'editData.deadline': e.detail.value }); },
  onEditAssignee(e) {
    var idx = e.detail.value;
    var user = this.data.allUsers[idx];
    if (user) this.setData({ 'editData.assignee_id': user.id, 'editData.assignee_username': user.username });
  },

  onSaveEdit() {
    var that = this;
    var d = that.data.editData;
    if (!d.name.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    that.setData({ saving: true });
    taskService.updateTask(that.data.taskId, {
      name: d.name, category: d.category, deadline: d.deadline,
      assigneeId: d.assignee_id || null, assigneeUsername: d.assignee_username || null
    }).then(function() {
      that.setData({ showEdit: false, saving: false });
      that.loadTask(that.data.taskId);
    }).catch(function() {
      that.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  // 底部操作
  onToggleStatus() {
    var that = this;
    taskService.toggleComplete(that.data.taskId, that.data.task.progress).then(function() {
      that.loadTask(that.data.taskId);
    });
  },

  onTerminate() {
    var that = this;
    wx.showModal({ title: '终止任务', content: '确定终止吗？', success: function(res) {
      if (res.confirm) taskService.terminateTask(that.data.taskId).then(function() { that.loadTask(that.data.taskId); });
    }});
  },

  onRestore() {
    var that = this;
    wx.showModal({ title: '恢复任务', content: '确定恢复吗？', success: function(res) {
      if (res.confirm) taskService.restoreTask(that.data.taskId, that.data.task.progress).then(function() { that.loadTask(that.data.taskId); });
    }});
  },

  onDelete() {
    var that = this;
    wx.showModal({ title: '删除任务', content: '删除后无法恢复！', confirmColor: '#F43F5E', success: function(res) {
      if (res.confirm) {
        taskService.deleteTask(that.data.taskId).then(function() {
          wx.navigateBack();
        });
      }
    }});
  }
});
