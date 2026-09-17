/**
 * Author: Lyove
 */
// pages/postList/index.js
import API from '../../utils/api';

const requestType = {
  all: {
    title: '列表',
    api: 'getPostsList'
  },
  id: {
    title: '',
    api: 'getPostsList'
  },
  search: {
    title: '',
    api: 'getPostsList'
  },
  sticky: {
    title: '置顶文章',
    api: 'getStickyPosts'
  },
  featured: {
    title: 'Featured',
    api: 'getPostsList'
  },
  recommended: {
    title: 'Recommended',
    api: 'getPostsList'
  },
  slider: {
    title: 'Slider',
    api: 'getPostsList'
  },
  rand: {
    title: '随机文章',
    api: 'getRandPosts'
  },
  related: {
    title: '相关文章',
    api: 'getRelatedPosts'
  },
  mostViews: {
    title: '热门阅读',
    api: 'getMostViewsPosts'
  },
  mostFav: {
    title: '热门收藏',
    api: 'getMostFavPosts'
  },
  mostLike: {
    title: '热门点赞',
    api: 'getMostLikePosts'
  },
  mostComment: {
    title: '热门评论',
    api: 'getMostCommentPosts'
  },
  recentComment: {
    title: '最新评论',
    api: 'getRecentCommentPosts'
  },
  userFav: {
    title: '我的收藏',
    api: 'getUserFavPosts'
  },
  userLike: {
    title: '我的点赞',
    api: 'getUserLikePosts'
  },
  userComments: {
    title: '我的评论',
    api: 'getUserCommentsPosts'
  }
};

Page({

  /**
   * Page initial data
   */
  data: {
    loading: false,
    siteInfo: '',
    title: '',
    page: 1,
    posts: [],
    isLoadAll: false
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {
    this.setData({
      options: options
    });
    this.getSiteInfo();
    this.getAdvert();
    // Posts of a category
    if (options.id) {
      this.getPostsList('id', {
        categories: options.id,
        page: this.data.page
      });
      this.setData({
        title: '类目'
      });
      this.getCategoryByID(options.id);
    }
    // Search post list
    if (options.s) {
      this.getPostsList('search', {
        search: options.s,
        page: this.data.page
      });
      this.setData({
        title: '关键词“' + options.s + '”的结果'
      });
      wx.setNavigationBarTitle({
        title: '关键词:' + options.s
      });
    }
    // Type (sticky | random | related | most views | most favs | most likes | most comments | recent comments)
    if (options.type) {
      const title = (requestType[options.type] && requestType[options.type].title) || '';
      this.getPostsList(options.type);
      this.setData({
        title
      });
      wx.setNavigationBarTitle({
        title
      });
    }
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
    if (this.data.options.id) {
      this.getPostsList('id', {
        categories: this.data.options.id
      });
    }
    if (this.data.options.s) {
      this.getPostsList('search', {
        search: this.data.options.s
      });
    }
    if (this.data.options.type) {
      this.getPostsList(this.data.options.type);
    }
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.setData({
        isBottom: true
      });
      if (this.data.options.id) {
        this.getPostsList('id', {
          categories: this.data.options.id,
          page: this.data.page + 1
        });
      }
      if (this.data.options.s) {
        this.getPostsList('search', {
          search: this.data.options.s,
          page: this.data.page + 1
        });
      }
      if (this.data.options.type) {
        this.getPostsList(this.data.options.type, {
          page: this.data.page + 1
        });
      }
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
   * Get category info
   */
  getCategoryByID: function (id) {
    API.getCategoryByID(id).then(res => {
      this.setData({
        title: res.name
      });
      wx.setNavigationBarTitle({
        title: res.name
      });
    })
      .catch(err => {
        console.log(err)
      });
  },

  // Post list
  getPostsList: function (type, data) {
    const requestApi = type && requestType[type] && requestType[type].api ? requestType[type].api : requestType.all.api;
    this.setData({
      loading: true
    });
    setTimeout(() => {
      wx.showLoading({
        title: 'Loading'
      });
    }, 100);
    API[requestApi](type, data).then(res => {
      wx.hideLoading();
      let args = {};
      // User-scoped lists (favorites / likes / comments) are returned in full, no pagination
      if (res.length < 10 || type === 'userFav' || type === 'userLike' || type === 'userComments') {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        })
      }
      if (this.data.isBottom) {
        args.posts = [].concat(this.data.posts, res)
        args.page = this.data.page + 1;
      } else {
        args.posts = res || [];
        args.page = 1;
      }
      this.setData({
        ...args,
        loading: false
      });
      wx.stopPullDownRefresh();
    })
      .catch(err => {
        wx.hideLoading();
        this.setData({
          loading: false
        });
        wx.stopPullDownRefresh();
        console.log(err);
      })
  },

  getAdvert: function () {
    API.listAdsense().then(res => {
      if (res.status === 200) {
        this.setData({
          advert: res.data
        })
      }
    })
      .catch(err => {
        console.log(err)
      })
  },

  bindDetail: function (e) {
    let id = e.currentTarget.id;
    wx.navigateTo({
      url: '/pages/post/index?id=' + id,
    })
  }

})
