/**
 * ssml-viewer component
 */
var render = require('../../utils/ssml-render.js');

Component({
  options: {
    addGlobalClass: false,
    multipleSlots: false,
  },
  properties: {
    content: {
      type: String,
      value: '',
    },
    model: {
      type: Object,
      value: null,
    },
    placeholder: {
      type: String,
      value: '',
    },
  },
  data: {
    blocks: [],
  },
  observers: {
    'content, model': function (content, model) {
      this.build(content, model);
    },
  },
  lifetimes: {
    attached: function () {
      this.build(this.data.content, this.data.model);
    },
  },
  methods: {
    build: function (content, model) {
      var blocks = [];
      try {
        if (model && model.blocks) {
          blocks = render.modelToSegments(model);
        } else if (content && content.trim()) {
          blocks = render.ssmlToSegments(content);
        }
      } catch (e) {
        blocks = [];
      }
      this.setData({ blocks: blocks });
    },
    onHintTap: function (e) {
      var hint = e.currentTarget.dataset.hint;
      if (!hint) {
        return;
      }
      wx.showModal({
        title: '提示',
        content: hint,
        showCancel: false,
        confirmText: '知道了',
      });
    },
  },
});
