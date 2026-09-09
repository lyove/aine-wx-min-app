/**
 * Author: Lyove
 */
const app = getApp();
import API from '../../utils/api';

Page({
  /**
   * Page initial data
   */
  data: {
    user: ''
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function () {

  },

  /**
   * Lifecycle function -- called after the page is first rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function -- called when the page is shown
   */
  onShow: function () {
    let user = app.globalData.user;
    if (!user) {
      user = '';
    }
    this.setData({
      user: user,
    });
  },

  /**
   * Lifecycle function -- called when the page is hidden
   */
  onHide: function () {

  },

  /**
   * Lifecycle function -- called when the page is unloaded
   */
  onUnload: function () {

  },

  /**
   * Page event handler -- triggered by user pull-down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {

  },

  /**
   * User taps the share button at the top right
   */
  onShareAppMessage: function () {

  },

  /**
   * Login (kept)
   */
  getUserProfile: function (e) {
    wx.showLoading({
      title: '正在登录...',
    });
    API.getUserProfile().then(res => {
      this.setData({
        user: res
      });
      wx.hideLoading();
    })
      .catch(err => {
        console.log(err);
        wx.hideLoading();
      });
  },

  /**
   * Logout (kept)
   */
  loginOut: function () {
    API.Loginout();
    wx.clearStorageSync();
    wx.showToast({
      title: '清除完毕',
    })
  },

  /**
   * Unified toast for under-development features
   */
  bindHandler: function (e) {
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none',
      duration: 1500
    });
  },

  /**
   * Subscribe (under development)
   */
  subscribeMessage: function (template, status) {
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none',
      duration: 1500
    });
  },

  bindSubscribe: function () {
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none',
      duration: 1500
    });
  },
})
