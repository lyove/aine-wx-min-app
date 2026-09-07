// pages/page/index.js
import API from '../../utils/api';
import strs from '../../utils/strs';

Page({

  /**
   * Page initial data
   */
  data: {
    loading: false,
    detail: '',
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {
    this.getPageByID(options.id);
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

  getPageByID: function (id) {
    let _this = this;
    API.getPageByID(id).then(res => {
      _this.setData({
        id: id,
        detail: {
          ...res,
          content: {
            ...res.content,
            rendered: strs.addTagClass(res.content?.rendered ?? '')
          },
          date: res.date ? /\d{4}-\d{1,2}-\d{1,2}/g.exec(res.date) : '-'
        }
      });
    })
      .catch(err => {
        console.log(err);
      });
  },
})