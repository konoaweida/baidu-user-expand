Component({
  "options": { "multipleSlots": true },
  properties: {
    tabs: {
      type: Array,
      value: []
    },
    currentTab: {
      type: Number,
      value: 0
    }
  },
  data: {
    swiperHeight: 0
  },
  lifetimes: {
    ready() {
      this.updateSwiperHeight(this.data.currentTab);
    }
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ currentTab: index });
      this.updateSwiperHeight(index);
    },
    onSwiperChange(e) {
      const index = e.detail.current;
      this.setData({ currentTab: index });
      this.updateSwiperHeight(index);
      this.triggerEvent('tabchange', { index });
    },
    updateSwiperHeight(index) {
      const query = this.createSelectorQuery();
      query.select(`#tab${index}`).boundingClientRect(rect => {
        if (rect && rect.height) {
          this.setData({ swiperHeight: rect.height });
        }
      }).exec();
    }
  }
});
