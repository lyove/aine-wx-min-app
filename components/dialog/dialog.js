// components/dialog/dialog.js
Component({
  /**
   * Component properties
   */
  properties: {
    // Dialog title
    title: {            // Property name
      type: String,     // Type (required)
      value: '标题'     // Initial value (optional)
    },
    // Dialog content
    content: {
      type: String,
      value: '弹窗内容'
    },
    // Cancel button text
    cancelText: {
      type: String,
      value: '取消'
    },
    // Confirm button text
    confirmText: {
      type: String,
      value: '确定'
    }
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
    // Hide dialog
    hideDialog() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    // Show dialog
    showDialog() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    /*
    * Private methods are suggested to start with an underscore
    * triggerEvent is used to emit events
    */
    _cancelEvent() {
      // Emit cancel callback
      this.triggerEvent("cancelEvent")
    },
    _confirmEvent() {
      // Emit confirm callback
      this.triggerEvent("confirmEvent");
    }
  },

  options: {
    multipleSlots: true // Enable multiple slot support in component options
  },
})
