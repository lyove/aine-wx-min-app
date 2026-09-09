/**
 * Author: Lyove
 */
import API from '/utils/base';

App({

  onLaunch: function () {
    API.login();
    // Get the system status bar info (sync APIs since base lib 2.20.1)
    const windowInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    this.globalData.StatusBar = windowInfo.statusBarHeight;
    this.globalData.CustomBar = deviceInfo.platform == 'android' ? windowInfo.statusBarHeight + 50 : windowInfo.statusBarHeight + 45;
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