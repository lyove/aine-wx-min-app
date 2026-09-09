/**
 * Author: Lyove
 */
const app = getApp();
import API from '../../utils/api';

Page({
  data: {
    siteInfo: '',
    user: app.globalData.user,
    navBarHeight: wx.getWindowInfo().statusBarHeight,
    placeHolder: '搜索、文章、图片、视频',
    autoFocus: false,
    inputEnable: true,
    stickyLoading: false,
    listLoading: false,
    stickyArticle: [],
    articles: [],
    page: 1,
    catsLoading: false,
    category: [],
    tabsLoading: false,
    tabs: [],
    tabsPaneData: [],
    activeTab: 0,
    indicatorDots: !1,
    autoplay: !0,
    interval: 3e3,
    currentSwiper: 0,
    isLastPage: false,
  },

  onLoad: function () {
    const deviceInfo = wx.getDeviceInfo();
    this.setData({
      isIphoneX: (deviceInfo.model || '').match(/iPhone X/gi)
    });
    this.getSiteInfo();
    this.getStickyArticles();
    this.getCategories();
    this.getArticlesList();
    this.getAdvert();
  },

  /**
   * Lifecycle function -- called after the page is first rendered
   */
  onReady: function () {

  },

  // Hot articles
  bindHotArticles: function () {
    wx.navigateTo({
      url: `/pages/articleList/index?type=mostViews`,
    });
  },

  // Open mini program
  toMiniProgram: function () {
    wx.navigateToMiniProgram({
      appId: 'wxa01e1baa46426a94',
      path: '',
      extraData: {

      },
      success(res) {
        // Opened successfully
      }
    })
  },

  // Open page list
  bindPageLists: function () {
    wx.navigateTo({
      url: '/pages/pagesList/index',
    });
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

  onClear: function () {
    this.setData({
      searchKey: '',
    })
  },

  /**
   * Page event handler -- triggered by user pull-down
   */
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
      isLastPage: false
    });
    this.getStickyArticles();
    this.getArticlesList();
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.setData({
        isBottom: true
      });
      this.getArticlesList({
        page: this.data.page + 1
      });
    }
  },

  /**
   * User taps the share button at the top right
   */
  onShareAppMessage: function () {
    return {
      title: this.data.siteInfo.name,
      path: '/pages/home/index'
    }
  },

  /**
   * Get mini program info
   */
  getSiteInfo: function () {
    API.getSiteInfo().then(res => {
      this.setData({
        siteInfo: res
      })
    })
      .catch(err => {
        console.log(err)
      });
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

  onInput: function (e) {
    this.setData({
      searchKey: e.detail.value
    })
  },

  currentChange: function (e) {
    this.setData({
      currentSwiper: e.detail.current
    });
  },

  getStickyArticles: function () {
    this.setData({
      stickyLoading: true
    });
    API.getStickyArticles().then(res => {
      this.setData({
        stickyLoading: false,
        stickyArticle: res || []
      });
    })
      .catch(err => {
        this.setData({
          stickyLoading: false,
        });
        console.log(err)
      })
  },

  getCategories: function (args) {
    this.setData({
      catsLoading: true,
    });
    API.getCategories(args).then(res => {
      this.setData({
        catsLoading: false,
        category: res,
        tabs: res.map((item, index) => ({
          ...item,
          title: item.name,
          index
        }))
      }, () => {
        this.getArticlesListById(res[0].id);
      });
    })
      .catch(err => {
        console.log(err)
      });
  },

  getArticlesList: function (data) {
    this.setData({
      listLoading: true,
    });
    API.getArticlesList(data).then(res => {
      let args = {};
      if (res.length < 10) {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        });
      }
      if (this.data.isBottom) {
        args.articles = [].concat(this.data.articles, res);
        args.page = this.data.page + 1;
      } else {
        args.articles = res || [];
        args.page = 1;
      }
      this.setData({
        ...args,
        listLoading: false
      });
      wx.stopPullDownRefresh();
    })
      .catch(err => {
        this.setData({
          listLoading: false
        });
        console.log(err);
        wx.stopPullDownRefresh();
      });
  },

  getArticlesListById: function(id) {
    this.setData({
      tabsLoading: true,
    });
    API.getArticlesList({
      categories: id
    }).then(res => {
      this.setData({
        tabsPaneData: (res || []).slice(0, 5),
        tabsLoading: false
      });
    })
      .catch(err => {
        this.setData({
          tabsLoading: false
        });
        console.log(err);
      });
  },

  onTabClick: function(e) {
    const { index, item } = e.detail;
    this.setData({ 
      activeTab: index
    });
    // this.getArticlesListById(item.id);
  },

  onTabChange: function(e) {
    const { index } = e.detail;
    const { tabs } = this.data;
    const item = tabs[index];
    this.setData({ 
      activeTab: index 
    });
    this.getArticlesListById(item.id);
  },

  getAdvert: function () {
    API.indexAdsense().then(res => {
      if (res.status === 200) {
        this.setData({
          advert: res.data
        });
      }
    })
      .catch(err => {
        console.log(err)
      });
  },

  bindCateByID: function (e) {
    let id = e.currentTarget.id;
    wx.navigateTo({
      url: '/pages/articleList/index?id=' + id,
    });
  },

  bindCateList: function () {
    wx.switchTab({
      url: '/pages/category/index',
    });
  },

  bindDetail: function (e) {
    let id = e.currentTarget.id;
    wx.navigateTo({
      url: '/pages/article/index?id=' + id,
    });
  },

  onConfirm: function (e) {
    let s = e.detail.value;
    wx.navigateTo({
      url: '/pages/articleList/index?s=' + s,
    });
  },
})
