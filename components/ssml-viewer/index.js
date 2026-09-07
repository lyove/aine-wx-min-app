/**
 * ssml-viewer component
 * Read-only SSML renderer for WeChat Mini Program.
 * Visual style ported from SSML-Editor-Vanilla (styles/styles.css):
 *  - range brackets: prosody [..] #f59e0b, emphasis {..} #ef4444, sayAs (..) #10b981, opacity .55 (read-only)
 *  - pinyin ruby above char: #4f7cff
 *  - break mark: double vertical bar #94a3b8
 *  - hint: dotted underline #f5a623, tap to show text
 */
var render = require('../../utils/ssml-render.js');

Component({
  options: {
    addGlobalClass: false,
    multipleSlots: false,
  },
  properties: {
    /** Raw SSML string, e.g. <speak><p>...</p></speak> */
    content: {
      type: String,
      value: '',
    },
    /** Structured SSMLModel ({ blocks, annotations, hints }) from CMS data-ssml */
    model: {
      type: Object,
      value: null,
    },
    /** Text shown when content is empty */
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
