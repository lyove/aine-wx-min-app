// pages/pagesList/index.js
import API from '../../utils/api';

Page({
  /**
   * Page initial data
   */
  data: {
    loading: false,
    siteInfo: '',
    title: '页面',
    page: 1,
    pages: [],
    isBottom: false,
    isLastPage: false
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {
    this.getSiteInfo();
    this.getPagesList(options);
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
      page: 1,
    });
    this.getPagesList();
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.setData({
        isBottom: true
      });
      this.getPagesList({
        page: this.data.page + 1
      });
    }
  },

  /**
   * User taps the share button at the top right
   */
  onShareAppMessage: function () {

  },

  /**
   * Get mini program info
   */
  getSiteInfo: function () {
    API.getSiteInfo().then(res => {
      this.setData({
        siteInfo: res
      });
    })
      .catch(err => {
        console.log(err)
      });
  },

  /**
   * Get page list
   */
  getPagesList: function () {
    this.setData({
      loading: true
    });
    setTimeout(() => {
      wx.showLoading({
        title: 'Loading'
      });
    }, 100);
    API.getPagesList().then(res => {
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
        args.pages = [].concat(this.data.pages, res);
        args.page = this.data.page + 1;
      } else {
        args.pages = res || [];
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

  bindPageByID: function (e) {
    let id = e.currentTarget.id;
    wx.navigateTo({
      url: '/pages/page/index?id=' + id,
    });
  },
})