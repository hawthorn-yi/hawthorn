Component({
  properties: {
    categories: { type: Array, value: [] },
    selectedId: { type: String, value: '' }
  },
  methods: {
    onSelect(e) {
      var id = e.currentTarget.dataset.id;
      this.triggerEvent('select', { categoryId: id });
    }
  }
});
