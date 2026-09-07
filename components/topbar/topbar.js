const app = getApp();
Component({
  /**
   * Component options
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * Component external properties
   */
  properties: {
    bgColor: {
      type: String,
      default: ''
    },
    isCustom: {
      // type: [Boolean, String],
      type: Boolean,
      default: false
    },
    isBack: {
      // type: [Boolean, String],
      type: Boolean,
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
  },
  /**
   * Component initial data
   */
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom
  },
  /**
   * Component methods
   */
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      });
    },
    toHome() {
      wx.reLaunch({
        url: '/pages/home/index',
      })
    }
  }
})