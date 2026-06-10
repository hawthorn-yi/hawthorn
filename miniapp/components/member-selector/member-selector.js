Component({
  properties: {
    members: { type: Array, value: [] },
    allUsers: { type: Array, value: [] }
  },
  data: {
    availableUsers: [],
    showPicker: false
  },
  observers: {
    'members, allUsers': function(members, allUsers) {
      var memberIds = (members || []).map(function(m) { return m.user_id; });
      var available = (allUsers || []).filter(function(u) { return memberIds.indexOf(u.id) === -1; });
      this.setData({ availableUsers: available });
    }
  },
  methods: {
    onShowPicker() { this.setData({ showPicker: true }); },
    onPickMember(e) {
      var idx = e.detail.value;
      var user = this.data.availableUsers[idx];
      if (user) this.triggerEvent('add', { userId: user.id, username: user.username });
    },
    onRemove(e) {
      this.triggerEvent('remove', { memberId: e.currentTarget.dataset.id });
    }
  }
});
