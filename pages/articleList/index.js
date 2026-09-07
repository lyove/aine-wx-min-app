/**
 * Author: Lyove
 */
// pages/articleList/index.js
import API from '../../utils/api';

const requestType = {
  all: {
    title: '列表',
    api: 'getArticlesList'
  },
  id: {
    title: '',
    api: 'getArticlesList'
  },
  search: {
    title: '',
    api: 'getArticlesList'
  },
  sticky: {
    title: '置顶文章',
    api: 'getStickyArticles'
  },
  rand: {
    title: '随机文章',
    api: 'getRandArticles'
  },
  related: {
    title: '相关文章',
    api: 'getRelatedArticles'
  },
  mostViews: {
    title: '热门阅读',
    api: 'getMostViewsArticles'
  },
  mostFav: {
    title: '热门收藏',
    api: 'getMostFavArticles'
  },
  mostLike: {
    title: '热门点赞',
    api: 'getMostLikeArticles'
  },
  mostComment: {
    title: '热门评论',
    api: 'getMostCommentArticles'
  },
  recentComment: {
    title: '最新评论',
    api: 'getRecentCommentArticles'
  },
  userFav: {
    title: '我的收藏',
    api: 'getUserFavArticles'
  },
  userLike: {
    title: '我的点赞',
    api: 'getUserLikeArticles'
  },
  userComments: {
    title: '我的评论',
    api: 'getUserCommentsArticles'
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
    articles: [],
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
    // Articles of a category
    if (options.id) {
      this.getArticlesList('id', {
        categories: options.id,
        page: this.data.page
      });
      this.setData({
        title: '类目'
      });
      this.getCategoryByID(options.id);
    }
    // Search article list
    if (options.s) {
      this.getArticlesList('search', {
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
      this.getArticlesList(options.type);
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
      this.getArticlesList('id', {
        categories: this.data.options.id
      });
    }
    if (this.data.options.s) {
      this.getArticlesList('search', {
        search: this.data.options.s
      });
    }
    if (this.data.options.type) {
      this.getArticlesList(this.options.type);
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
        this.getArticlesList('id', {
          categories: this.data.options.id,
          page: this.data.page + 1
        });
      }
      if (this.data.options.s) {
        this.getArticlesList('search', {
          search: this.data.options.s,
          page: this.data.page + 1
        });
      }
      if (this.data.options.type) {
        this.getArticlesList(this.options.type, {
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

  // Article list
  getArticlesList: function (type, data) {
    const requestApi = type && requestType[type] && requestType[type].api ? requestType[type].api : requestType.all.api;
    this.setData({
      loading: true
    });
    setTimeout(() => {
      wx.showLoading({
        title: 'Loading'
      });
    }, 100);
    API[requestApi](data).then(res => {
      wx.hideLoading();
      let args = {};
      if (res.length < 10) {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        })
      }
      if (this.data.isBottom) {
        args.articles = [].concat(this.data.articles, res)
        args.page = this.data.page + 1;
      } else {
        args.articles = res || [];
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
      url: '/pages/article/index?id=' + id,
    })
  }

})
