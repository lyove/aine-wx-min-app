// pages/article/index.js
/**
 * Author: Lyove
 */
const app = getApp();
import API from '../../utils/api';
import strs from '../../utils/strs';
import { extractSsmlBlocks } from '../../utils/ssml-render';

let isFocusing = false;

Page({
  /**
   * Page initial data
   */
  data: {
    loading: false,
    detail: null,
    textNum: 0,
    enableComment: false,
    comments: [],
    commentsPage: 1,
    placeholder: '输入评论'
  },

  /**
   * Lifecycle function -- called when the page loads
   */
  onLoad: function (options) {
    const deviceInfo = wx.getDeviceInfo();
    this.setData({
      isIphoneX: (deviceInfo.model || '').match(/iPhone X/gi)
    });
    this.setData({ 
      options: options 
    });
    this.getArticleByID(options.id);
    this.getAdvert();
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
    let user = app.globalData.user
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
    this.setData({
      commentsPage: 1
    });
    this.getArticleByID(this.data.options.id);
    this.getComments({
      id: this.data.options.id,
      page: this.data.commentsPage
    });
  },

  /**
   * Handler for the page scroll-to-bottom event
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.getComments({
        id: this.data.options.id,
        page: this.data.commentsPage + 1
      });
    }
  },

  /**
   * User taps the share button at the top right
   */
  onShareAppMessage: function () {
    return {
      title: this.data.detail.title.rendered,
      path: '/pages/article/index?id=' + this.data.detail.id,
      imageUrl: this.data.detail.meta.thumbnail
    };
  },

  getArticleByID: function (id) {
    let _this = this;
    API.getArticleByID(id).then(res => {
      _this.setData({
        id: id,
        detail: {
          ...res,
          content: {
            ...res.content,
            rendered: strs.addTagClass(res.content?.rendered ?? '')
          },
          contentParts: this.buildContentParts(res.content?.rendered ?? ''),
          date: res.date ? /\d{4}-\d{1,2}-\d{1,2}/g.exec(res.date) : '-'
        }
      });
      if (res.comments !== 0) {
        this.getComments({
          id: id,
          page: 1
        });
      }
    })
      .catch(err => {
        console.log(err)
      });
  },

  /**
   * Split the article body into render parts: plain HTML (rendered by mp-html)
   * and embedded SSML blocks (rendered by ssml-viewer), mirroring the Aine
   * frontend SsmlContent component.
   */
  buildContentParts: function (html) {
    const parts = extractSsmlBlocks(html || '');
    return parts.map((part, i) => {
      if (part.k === 'html') {
        return {
          k: 'html',
          key: 'p' + i,
          html: strs.addTagClass(part.html)
        };
      }
      return {
        k: 'ssml',
        key: 'p' + i,
        model: part.model
      };
    });
  },

  getAdvert: function () {
    API.detailAdsense().then(res => {
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

  getComments: function (params) {
    API.getComments(params).then(res => {
      let data = {};
      if (res.length < 10) {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        });
      }
      if (this.data.isBottom) {
        data.comments = [].concat(this.data.comments, res);
        data.commentsPage = this.data.commentsPage + 1;
      } else {
        data.comments = res || [];
        data.commentsPage = 1;
      }
      this.setData(data);
    })
  },

  bindFavTap: function (e) {
    let args = {};
    let detail = this.data.detail;
    args.id = detail.id;
    API.setFavComments(args).then(res => {
      if (res.status === 200) {
        detail.isfav = true
        this.setData({
          detail: detail
        });
        wx.showToast({
          title: '加入收藏!',
          icon: 'success',
          duration: 900,
        });
      } else if (res.status === 202) {
        detail.isfav = false;
        this.setData({
          detail: detail
        });
        wx.showToast({
          title: '取消收藏!',
          icon: 'success',
          duration: 900,
        });
      } else {
        wx.showModal({
          title: '温馨提示',
          content: '数据出错, 建议清除缓存重新尝试',
          success: response => {
            wx.removeStorageSync('user')
            wx.removeStorageSync('token')
            wx.removeStorageSync('expired_in')
          }
        });
      }
    })
      .catch(err => {
        console.log(err)
      });
  },

  bindLikeTap: function (e) {
    let args = {};
    let detail = this.data.detail;
    args.id = detail.id;
    API.setLikeComments(args).then(res => {
      if (res.status === 200) {
        detail.islike = true;
        this.setData({
          detail: detail,
        });
        wx.showToast({
          title: '谢谢点赞!',
          icon: 'success',
          duration: 900,
        });
      } else if (res.status === 202) {
        detail.islike = false;
        this.setData({
          detail: detail,
        });
        wx.showToast({
          title: '取消点赞!',
          icon: 'success',
          duration: 900,
        });
      } else {
        wx.showModal({
          title: '温馨提示',
          content: '数据出错, 建议清除缓存重新尝试',
          success: response => {
            wx.removeStorageSync('user')
            wx.removeStorageSync('token')
            wx.removeStorageSync('expired_in')
          }
        });
      }
    })
      .catch(err => {
        console.log(err)
      });
  },

  addComment: function (e) {
    const _this = this;
    let args = {
      id: this.data.detail.id,
      content: this.data.content,
      parent: this.data.parent
    };
    if (!this.data.user) {
      wx.showModal({
        title: '提示',
        content: '必须授权登录才可以评论',
        success: function (res) {
          if (res.confirm) {
            _this.getUserProfile();
          }
        }
      });
    } else if (args.content.length === 0) {
      wx.showModal({
        title: '提示',
        content: '评论内容不能为空'
      });
    } else {
      API.addComment(args).then(res => {
        if (res.status === 200) {
          this.setData({
            commentsPage: 1,
            showTextarea: false,
            content: "",
            comments: [],
            placeholder: "",
            focus: false
          });
          setTimeout(function () {
            wx.showModal({
              title: '温馨提示',
              content: res.message
            })
          }, 900);
          if (!this.data.isComments) {
            this.setData({
              isComments: true,
              placeholder: ''
            });
          }
          this.bindSubscribe();
          this.getComments({
            id: this.data.options.id,
            page: this.data.commentsPage
          });
        } else if (res.status === 500) {
          wx.showModal({
            title: '提示',
            content: '评论失败，请稍后重试。'
          });
        } else {
          wx.showModal({
            title: '提示',
            content: '必须授权登录才可以评论',
            success: function (res) {
              if (res.confirm) {
                _this.getUserProfile();
              }
            }
          });
        }
      })
        .catch(err => {
          console.log(err)
          wx.showModal({
            title: '提示',
            content: '评论失败，请稍后重试。'
          })
        });
    }
  },

  replyComment: function (e) {
    isFocusing = true;
    let parent = e.currentTarget.dataset.parent
    let reply = e.currentTarget.dataset.reply
    this.setData({
      focus: true,
      isReply: true,
      parent: parent,
      placeholder: " 回复 " + reply + ":"
    })
  },

  subscribeMessage: function (template, status) {
    let args = {};
    args.openid = this.data.user.openId;
    args.template = template;
    args.status = status;
    args.pages = getCurrentPages()[0].route;
    args.platform = wx.getDeviceInfo().platform;
    args.program = 'WeChat';
    API.subscribeMessage(args).then(res => {
      // console.log(res)
    })
      .catch(err => {
        console.log(err)
      });
  },

  bindSubscribe: function () {
    let _this = this;
    let templates = API.template().comments;
    wx.requestSubscribeMessage({
      tmplIds: templates,
      success(res) {
        if (res.errMsg == "requestSubscribeMessage:ok") {
          for (let i = 0; i < templates.length; i++) {
            let template = templates[i]
            _this.subscribeMessage(template, "accept")
          }
          wx.showToast({
            title: "订阅完成",
            icon: 'success',
            duration: 1000
          });
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

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
        console.log(err)
        wx.hideLoading()
      });
  },

  onRepleyFocus: function (e) {
    isFocusing = false;
    if (!this.data.isFocus) {
      this.setData({
        focus: true
      });
    }
  },

  onReplyBlur: function (e) {
    let _this = this;
    if (!_this.data.focus) {
      const text = e.detail.value.trim();
      if (text === '') {
        _this.setData({
          parent: "0",
          placeholder: "评论...",
          commentdate: ""
        });
      }
    } else {
      _this.setData({
        placeholder: "不说算了，哼",
        focus: false
      })
    }
  },

  bindInputContent: function (e) {
    if (e.detail.value.length > 0) {
      this.setData({
        content: e.detail.value,
        textNum: e.detail.value.length,
        iscanpublish: true
      });
    } else {
      this.setData({
        iscanpublish: false
      });
    }
  },

  tapcomment: function (e) {
    let _this = this;
    let id = e.currentTarget.id;
    if (id) {
      this.setData({
        id: id,
        showTextarea: true
      });
    } else {
      this.setData({
        showTextarea: true
      });
    }
    setTimeout(function () {
      _this.setData({
        focus: true
      });
    }, 100);
  },

  closeCommentary: function () {
    this.setData({
      showTextarea: false
    });
  },

  bindBack: function () {
    wx.navigateBack();
  },

  shareClick: function () {
    this.setData({
      shareshow: true,
    });
  },

  handleActionsheetMaskClick: function () {
    this.setData({
      shareshow: false,
    });
  },

  downloadPrefix: function () {
    let _this = this;
    let args = {};
    let qrcodePath = '';
    let prefixPath = '';
    let title = this.data.detail.title.rendered;
    let excerpt = this.data.detail.excerpt.rendered;
    args.id = this.data.detail.id;
    API.getCodeImg(args).then(res => {
      if (res.status === 200) {
        const downloadTaskqrCode = wx.downloadFile({
          url: res.qrcode,
          success: qrcode => {
            if (qrcode.statusCode === 200) {
              qrcodePath = qrcode.tempFilePath;
              console.log("二维码图片本地位置：" + qrcode.tempFilePath);
              const downloadTaskCoverPrefix = wx.downloadFile({
                url: res.cover,
                success: response => {
                  if (response.statusCode === 200) {
                    prefixPath = response.tempFilePath;
                    console.log("文章图片本地位置：" + response.tempFilePath);
                    if (prefixPath && qrcodePath) {
                      _this.createArticlePrefix(prefixPath, qrcodePath, title, excerpt);
                    }
                  } else {
                    wx.hideLoading();
                    wx.showToast({
                      title: "下载封面失败",
                      mask: true,
                      duration: 2000
                    });
                  }
                }
              });
              downloadTaskCoverPrefix.onProgressUpdate((res) => {
                wx.showLoading({
                  title: "正在下载封面...",
                  mask: true,
                });
                console.log('下载下载封面进度：' + res.progress)
              })
            } else {
              wx.hideLoading();
              wx.showToast({
                title: "下载二维码失败",
                mask: true,
                duration: 2000
              });
            }
          }
        })
        downloadTaskqrCode.onProgressUpdate((res) => {
          wx.showLoading({
            title: "正在下载二维码...",
            mask: true,
          });
          console.log('下载二维码进度', res.progress)
        })
      }
    })
  },
  // Convert canvas to an image and save it locally, then pass the path to the image's src
  createArticlePrefix: function (prefixPath, qrcodePath, title, excerpt) {
    wx.showLoading({
      title: "正在生成海报",
      mask: true,
    });
    let textTitle = title.replace(/<\/?.+?>/g, "").replace(/[\r\n]/g, "").replace(/ /g, "")
    let textExcerpt = excerpt.replace(/<\/?.+?>/g, "").replace(/[\r\n]/g, "").replace(/ /g, "")
    let context = wx.createCanvasContext('prefix');
    context.setFillStyle('#ffffff');// Fill background color
    context.fillRect(0, 0, 600, 970);
    context.drawImage(prefixPath, 0, 0, 600, 400);// Draw the cover image
    context.drawImage(qrcodePath, 40, 720, 180, 180);// Draw the QR code
    context.setFillStyle("#333333");
    context.setFontSize(32);
    context.setTextAlign('left');
    context.fillText("Wordpress小程序", 240, 780);
    context.setFillStyle("#666666");
    context.setFontSize(28);
    context.setTextAlign('left');
    context.fillText("又一个 WordPress小程序", 240, 830);
    context.setFillStyle("#696969");
    context.setFontSize(24);
    context.setTextAlign('left');
    context.fillText("阅读详情,请长按识别二维码", 240, 880);
    context.setFillStyle("#000000");
    this.CanvasTextContent(context, textTitle, textExcerpt);// Article title
    context.draw();
    // Save the generated image locally; delay a while because drawing takes time
    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'prefix',
        success: function (res) {
          wx.hideLoading();
          wx.previewImage({
            current: res.tempFilePath,
            urls: [res.tempFilePath]
          })
          console.log("海报图片路径：" + res.tempFilePath);
        },
        fail: function (err) {
          console.log(err);
          wx.hideLoading();
        }
      });
    }, 900);
  },

  CanvasTextContent: function (context, title, excerpt) {
    let textLength = title.replace(/[\u0391-\uFFE5]/g, "aa").length
    context.setFillStyle("#000000")
    if (textLength <= 17) {
      // Draw titles of 14 chars or fewer on one line for a better look
      context.setFontSize(30)
      context.setTextAlign('left')
      context.fillText(title, 30, 460)
    } else {
      // For longer titles, draw only the first 34 chars (15-18 chars also stay on one line, slightly less pretty)
      context.setFontSize(30)
      context.setTextAlign('left')
      context.fillText(title.substring(0, 18), 30, 460)
      context.fillText(title.substring(18, 36), 30, 520)
    }
    context.setFillStyle("#666666")
    context.setFontSize(24)
    context.setTextAlign('left')
    context.fillText(excerpt.substring(0, 22), 35, 580)
    context.fillText(excerpt.substring(23, 44), 35, 624)
    context.fillText(excerpt.substring(45, 64), 35, 668)
    context.stroke()
    context.save()
  }
})