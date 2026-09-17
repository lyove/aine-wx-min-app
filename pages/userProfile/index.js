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
    user: '',
    showLogin: false,
    loginAccount: '',
    loginPassword: '',
    logining: false,
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
   * Open the login dialog (top avatar / profile card)
   */
  showLogin: function () {
    if (this.data.user) {
      wx.showToast({
        title: '已登录',
        icon: 'success',
        duration: 800
      });
      return;
    }
    this.setData({
      showLogin: true,
    });
  },

  /**
   * Stop event propagation inside the dialog
   */
  noop: function () {

  },

  /**
   * Close the login dialog
   */
  closeLogin: function () {
    if (this.data.logining) {
      return;
    }
    this.setData({
      showLogin: false,
    });
  },

  /**
   * Account input
   */
  onLoginAccount: function (e) {
    this.setData({
      loginAccount: e.detail.value,
    });
  },

  /**
   * Password input
   */
  onLoginPassword: function (e) {
    this.setData({
      loginPassword: e.detail.value,
    });
  },

  /**
   * Submit login against the Aine account (api.lyove.com)
   */
  submitLogin: function () {
    if (this.data.logining) {
      return;
    }
    const account = (this.data.loginAccount || '').trim();
    const password = this.data.loginPassword || '';
    if (!account || !password) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none',
      });
      return;
    }
    this.setData({
      logining: true,
    });
    API.loginByPassword(account, password).then(res => {
      // Normalize the user object (avatar URL etc.)
      const u = Object.assign({}, res.user || {});
      let avatar = u.avatar || '';
      if (avatar && avatar.indexOf('http') !== 0) {
        avatar = API.getHost() + avatar;
      }
      u.avatarUrl = avatar;
      API.storageUser(Object.assign({}, res, { user: u }));
      this.setData({
        user: u,
        showLogin: false,
        loginAccount: '',
        loginPassword: '',
        logining: false,
      });
      wx.showToast({
        title: '登录成功',
        icon: 'success',
      });
    }).catch(err => {
      console.log(err);
      this.setData({
        logining: false,
      });
    });
  },

  /**
   * Logout
   */
  loginOut: function () {
    API.Loginout();
    wx.clearStorageSync();
    this.setData({
      user: '',
    });
    wx.showToast({
      title: '已退出登录',
    })
  },

  /**
   * Go to a user-scoped list (favorites / likes / comments)
   */
  goUserList: function (e) {
    const type = e.currentTarget.dataset.type;
    if (!type) {
      return;
    }
    if (!API.getUser()) {
      // Not logged in -> show the login dialog
      this.showLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/postList/index?type=' + type
    });
  },
})
