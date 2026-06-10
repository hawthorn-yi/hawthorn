const taskService = require('../../services/tasks.js');
const attachmentService = require('../../services/attachments.js');

Page({
  data: { groups: [], allGroups: [], loading: true, searchQuery: '' },

  onLoad() { this.loadData(); },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    return taskService.fetchAllData().then(function(result) {
      var groups = [];
      result.tasks.forEach(function(t) {
        if (t.attachments && t.attachments.length > 0) {
          t.attachments.forEach(function(a) {
            if (a.size < 1024) a.sizeText = a.size + ' B';
            else if (a.size < 1024*1024) a.sizeText = (a.size/1024).toFixed(1) + ' KB';
            else a.sizeText = (a.size/1024/1024).toFixed(1) + ' MB';
          });
          groups.push({ taskId: t.id, taskName: t.name, attachments: t.attachments });
        }
      });
      that.setData({ groups: groups, allGroups: groups, loading: false });
    }).catch(function() { that.setData({ loading: false }); });
  },

  onSearchInput(e) {
    var q = e.detail.value.toLowerCase();
    this.setData({ searchQuery: q });
    var filtered = this.data.allGroups.map(function(g) {
      return { taskId: g.taskId, taskName: g.taskName, attachments: g.attachments.filter(function(a) { return a.name.toLowerCase().indexOf(q) !== -1; }) };
    }).filter(function(g) { return g.attachments.length > 0; });
    this.setData({ groups: filtered });
  },

  onSearchClear() { this.setData({ searchQuery: '', groups: this.data.allGroups }); },

  onPreview(e) {
    var gIdx = e.currentTarget.dataset.groupIndex;
    var idx = e.currentTarget.dataset.index;
    var att = this.data.groups[gIdx] && this.data.groups[gIdx].attachments[idx];
    if (att) attachmentService.previewAttachment(att);
  }
});
