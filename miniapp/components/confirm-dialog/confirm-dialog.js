Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '确认' },
    message: { type: String, value: '' },
    confirmText: { type: String, value: '确认' },
    confirmColor: { type: String, value: '#3B82F6' }
  },
  methods: {
    onConfirm() { this.triggerEvent('confirm'); },
    onCancel() { this.triggerEvent('cancel'); }
  }
});
