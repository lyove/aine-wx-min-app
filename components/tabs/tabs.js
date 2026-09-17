Component({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // Mark all data fields starting with _ as pure data fields
    multipleSlots: true // Enable multiple slot support in component options
  },
  properties: {
    tabs: {type: Array, value: []}, // Data item format is `{title}`
    activeTab: {type: Number, value: 0}, // Currently active tab
    tabClass: {type: String, value: ''}, // Tab style
    swiperClass: {type: String, value: ''}, // Swiper style for the content area
    swiperStyle: {type: String, value: ''}, // Swiper inline style (e.g. height for content-adaptive panels)
    activeClass: {type: String, value: ''}, // Style of the selected tab
    tabUnderlineColor: {type: String, value: '#07c160'}, // Underline color of the selected tab
    tabActiveTextColor: {type: String, value: '#000000'}, // Text color of the selected tab
    tabInactiveTextColor: {type: String, value: '#000000'}, // Text color of unselected tabs
    tabBackgroundColor: {type: String, value: '#ffffff'}, // Tab background color
    duration: {type: Number, value: 500}, // Content switch duration
  },
  data: {
    currentView: 0
  },

  observers: {
    activeTab: function(activeTab) {
      const len = this.data.tabs.length
      if (len === 0) {
        return;
      }
      let currentView = activeTab - 1
      if (currentView < 0) {
        currentView = 0;
      }
      if (currentView > len - 1) {
        currentView = len - 1;
      }
      this.setData({
        currentView
      });
    }
  },

  lifetimes: {
    created() {
      
    }
  },

  methods: {
    handleTabClick(e) {
      const { index, item } = e.currentTarget.dataset;
      this.setData({
        activeTab: index
      });
      this.triggerEvent('tabclick', { index, item });
    },
    handleSwiperChange(e) {
      const index = e.detail.current;
      this.setData({ 
        activeTab: index
      });
      this.triggerEvent('change', { index });
    }
  }
})
  
