// pages/category/index.js
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
    user: app.globalData.user,
    loading: false,
    page: 1,
    category: [],
    isBottom: false,
    isLastPage: false
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {
    this.getCategories(options);
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
    this.setData({
      loading: true,
      page: 1,
      isBottom: false
    })
    this.getCategories();
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    this.setData({
      isBottom: true
    });
    if (!this.data.isLastPage) {
      this.getCategories({ 
        page: this.data.page + 1
      });
    }
  },

  /**
   * Login
   */
  getUserProfile: function () {
    if(this.data.user) {
      wx.showToast({
        title: '已经登录',
        icon: 'success',
        duration: 800
      });
      return;
    }
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
   * User taps the share button at the top right
   */
  onShareAppMessage: function () {

  },

  getCategories: function () {
    this.setData({
      loading: true
    });
    setTimeout(() => {
      wx.showLoading({
        title: 'Loading'
      });
    }, 100);
    API.getCategories().then(res => {
      wx.hideLoading();
      let args = {};
      if (res.length < 10) {
        this.setData({
          isLastPage: true
        });
      }
      if (this.data.isBottom) {
        wx.showToast({
          title: '加载下一页',
          icon: 'loading',
          duration: 1000
        });
        args.category = [].concat(this.data.category, res);
        args.page = this.data.page + 1;
      } else {
        args.category = res || [];
        args.page = 1;
      }
      this.setData({
        ...args,
        loading: false,
      });
      wx.stopPullDownRefresh();
    })
      .catch(err => {
        wx.hideLoading();
        this.setData({
          loading: false,
        });
        wx.stopPullDownRefresh();
        console.log(err);
      });
  },

  bindCateByID: function (e) {
    let id = e.currentTarget.id;
    wx.navigateTo({
      url: '/pages/articleList/index?id=' + id,
    });
  }
})