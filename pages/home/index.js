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
    stickyPost: [],
    posts: [],
    page: 1,
    catsLoading: false,
    category: [],
    tabsLoading: false,
    tabs: [],
    tabsPaneData: [],
    activeTab: 0,
    tabsHeight: '660rpx',
    indicatorDots: !1,
    autoplay: !0,
    interval: 3e3,
    currentSwiper: 0,
    isLastPage: false,
    showLogin: false,
    loginAccount: '',
    loginPassword: '',
    logining: false,
  },

  onLoad: function () {
    const deviceInfo = wx.getDeviceInfo();
    this.setData({
      isIphoneX: (deviceInfo.model || '').match(/iPhone X/gi)
    });
    this.getSiteInfo();
    this.getStickyPosts();
    this.getCategories();
    this.getPostsList();
    this.getAdvert();
  },

  /**
   * Lifecycle function -- called after the page is first rendered
   */
  onReady: function () {

  },

  // Featured posts
  bindHotPosts: function () {
    wx.navigateTo({
      url: `/pages/postList/index?type=featured`,
    });
  },

  // Recommended posts
  bindRecommended: function () {
    wx.navigateTo({
      url: `/pages/postList/index?type=recommended`,
    });
  },

  // Slider posts
  bindSliderPosts: function () {
    wx.navigateTo({
      url: `/pages/postList/index?type=slider`,
    });
  },

  /**
   * Lifecycle function -- called when the page is shown
   */
  onShow: function () {
    // Sync login state (e.g. logged in on the profile page, then back to home)
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
    this.getStickyPosts();
    this.getPostsList();
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.setData({
        isBottom: true
      });
      this.getPostsList({
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
   * Open the login dialog (top avatar)
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
      if (avatar && avatar.indexOf('https://') === 0) {
        // already https, keep as-is
      } else if (avatar && avatar.indexOf('http://') === 0) {
        // mini programs only load https images
        avatar = avatar.replace('http://', 'https://');
      } else if (avatar) {
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

  getStickyPosts: function () {
    this.setData({
      stickyLoading: true
    });
    API.getStickyPosts().then(res => {
      this.setData({
        stickyLoading: false,
        stickyPost: res || []
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
        this.getPostsListById(res[0].id);
      });
    })
      .catch(err => {
        console.log(err)
      });
  },

  getPostsList: function (data) {
    this.setData({
      listLoading: true,
    });
    API.getPostsList(data).then(res => {
      let args = {};
      if (res.length < 10) {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        });
      }
      if (this.data.isBottom) {
        args.posts = [].concat(this.data.posts, res);
        args.page = this.data.page + 1;
      } else {
        args.posts = res || [];
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

  getPostsListById: function(id) {
    this.setData({
      tabsLoading: true,
    });
    API.getPostsList({
      categories: id
    }).then(res => {
      this.setData({
        tabsPaneData: (res || []).slice(0, 5),
        tabsLoading: false
      }, () => {
        wx.nextTick(() => {
          this.adjustTabsHeight();
        });
      });
    })
      .catch(err => {
        this.setData({
          tabsLoading: false
        });
        console.log(err);
      });
  },

  /**
   * Make the panel height adapt to its content: measure the active tab panel
   * height and apply it to the swiper, so content never overflows onto the
   * section below (and short content leaves no huge blank).
   */
  adjustTabsHeight: function () {
    const that = this;
    wx.createSelectorQuery()
      .selectAll('.itemize .tabs-box')
      .boundingClientRect(function (rects) {
        if (rects && rects.length) {
          const rect = rects[that.data.activeTab] || rects[0];
          if (rect && rect.height) {
            that.setData({
              tabsHeight: rect.height + 'px'
            });
          }
        }
      })
      .exec();
  },

  onTabClick: function(e) {
    const { index, item } = e.detail;
    this.setData({ 
      activeTab: index
    });
    // this.getPostsListById(item.id);
  },

  onTabChange: function(e) {
    const { index } = e.detail;
    const { tabs } = this.data;
    const item = tabs[index];
    this.setData({ 
      activeTab: index 
    });
    this.getPostsListById(item.id);
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
      url: '/pages/postList/index?id=' + id,
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
      url: '/pages/post/index?id=' + id,
    });
  },

  onConfirm: function (e) {
    let s = e.detail.value;
    wx.navigateTo({
      url: '/pages/postList/index?s=' + s,
    });
  },
})
