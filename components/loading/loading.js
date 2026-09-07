// components/loading.js
Component({
  /**
   * Component properties
   */
  properties: {
    text: {             // Property name
      type: String,     // Type (required)
      value: 'Loading'  // Initial value (optional)
    },
  },

  /**
   * Component initial data
   */
  data: {
    // Modal visibility control
    isShow: false
  },

  /**
   * Component methods
   */
  methods: {
    // Show
    showLoading() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    // Hide
    hideLoading() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
  },

  options: {
    multipleSlots: true // Enable multiple slot support in component options
  },
})
