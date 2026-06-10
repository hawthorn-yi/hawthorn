Component({
  properties: {
    status: { type: String, value: 'active' },
    customStyle: { type: String, value: '' }
  },
  data: { text: '', typeClass: '' },
  observers: {
    status: function(s) {
      var map = {
        'active': { text: '进行中', cls: 'badge-primary' },
        'completed': { text: '已完成', cls: 'badge-success' },
        'overdue': { text: '已逾期', cls: 'badge-danger' },
        'terminated': { text: '已终止', cls: 'badge-warning' }
      };
      var info = map[s] || map['active'];
      this.setData({ text: info.text, typeClass: info.cls });
    }
  }
});
