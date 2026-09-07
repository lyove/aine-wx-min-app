/**
 * Author: Lyove
 */
import API from '/utils/base';

App({

  onLaunch: function () {
    API.login();
    // Get the system status bar info
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        this.globalData.CustomBar = e.platform == 'android' ? e.statusBarHeight + 50 : e.statusBarHeight + 45;
      }
    })
  },

  onShow: function () {
    this.globalData.user = API.getUser();
  },

  globalData: {
    user: '',
    StatusBar: '',
    CustomBar: ''
  }
})