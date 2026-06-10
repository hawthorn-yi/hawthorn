Component({
  properties: {
    taskId: { type: String, value: '' },
    name: { type: String, value: '' },
    status: { type: String, value: 'active' },
    progress: { type: Number, value: 0 },
    categoryName: { type: String, value: '' },
    categoryColor: { type: String, value: '#3B82F6' },
    deadline: { type: String, value: '' },
    assigneeUsername: { type: String, value: '' },
    historyCount: { type: Number, value: 0 },
    showActions: { type: Boolean, value: true }
  },

  data: {
    statusText: '',
    statusClass: '',
    statusColor: '',
    progressColor: '',
    completed: false
  },

  observers: {
    'status, progress': function(status, progress) {
      var statusMap = {
        'active': { text: '进行中', cls: 'badge-primary', color: '#3B82F6' },
        'completed': { text: '已完成', cls: 'badge-success', color: '#10B981' },
        'overdue': { text: '已逾期', cls: 'badge-danger', color: '#F43F5E' },
        'terminated': { text: '已终止', cls: 'badge-warning', color: '#F59E0B' }
      };
      var info = statusMap[status] || statusMap['active'];
      this.setData({
        statusText: info.text, statusClass: info.cls, statusColor: info.color,
        progressColor: progress >= 100 ? '#10B981' : status === 'overdue' ? '#F43F5E' : '#3B82F6',
        completed: progress === 100
      });
    }
  },

  methods: {
    onTap() { this.triggerEvent('tap', { taskId: this.properties.taskId }); },
    onLongPress() { this.triggerEvent('longpress', { taskId: this.properties.taskId }); },
    onToggleComplete() { this.triggerEvent('toggle', { taskId: this.properties.taskId, progress: this.properties.progress }); },
    onMore() { this.triggerEvent('more', { taskId: this.properties.taskId }); }
  }
});
