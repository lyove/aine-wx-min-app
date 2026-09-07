// pages/toolkit/index.js
/**
 * Author: Lyove
 */

Page({

  /**
   * Page initial data
   */
  data: {
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {

  },

  /**
   * Lifecycle function -- called after the page is first rendered
   */
  onReady: function () {
    // Get the dialog component
    this.dialog = this.selectComponent("#dialog");
    this.loading = this.selectComponent("#loading");
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
   * Show dialog
   * ===================================
   */
  showDialog() {
    this.dialog.showDialog();
  },

  // Dialog cancel event
  _cancelEvent() {
    console.log('你点击了取消');
    this.dialog.hideDialog();
  },

  // Dialog confirm event
  _confirmEvent() {
    console.log('你点击了确定');
    this.dialog.hideDialog();
  },



  /**
   * Show loading
   * ===================================
   */
  showLoading() {
    const _this = this;
    this.loading.showLoading();
    setTimeout(() => {
      _this.loading.hideLoading();
    }, 1500);
  },

})