Component({
  properties: {
    placeholder: { type: String, value: '搜索...' },
    value: { type: String, value: '' }
  },
  methods: {
    onInput(e) { this.triggerEvent('input', { value: e.detail.value }); },
    onSearch() { this.triggerEvent('search', { value: this.properties.value }); },
    onClear() { this.triggerEvent('input', { value: '' }); this.triggerEvent('clear'); }
  }
});
