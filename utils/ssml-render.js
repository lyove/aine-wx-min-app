/**
 * ssml-render.js
 * Build read-only render segments from an SSMLModel.
 * Ported from SSML-Editor-Vanilla view/vnode.ts (buildBlockVNodes), simplified:
 * no caret / selection / hover / editing — only visual tokens for read-only display.
 *
 * Segment kinds:
 *   { k:'b', ch, c }   bracket token (ch: [ ] { } ( ), c: prosody|emphasis|sayAs)
 *   { k:'c', ch, py }  single char with pinyin ruby (py optional)
 *   { k:'t', s }       merged plain text run (no pinyin, no brackets)
 *   { k:'bk' }         break / pause mark
 *   { k:'h', hint, segs } hint group (dotted underline), segs nested segments
 */
var core = require('./ssml-core.js');

var EMPTY = [];

function makeSeg(seg) {
  seg.key = seg.key || ('s' + (Math.random().toString(36).slice(2, 8)));
  return seg;
}

function rangeFeatureEnabled(type) {
  return type === 'prosody' || type === 'sayAs' || type === 'emphasis';
}

/**
 * modelToSegments(model) -> [{ id, segs: [...] }]
 */
function modelToSegments(model) {
  var blocks = model.blocks || [];
  var anns = model.annotations || [];
  var hints = model.hints || [];

  var annsByBlock = {};
  for (var i = 0; i < anns.length; i++) {
    var a = anns[i];
    (annsByBlock[a.blockId] = annsByBlock[a.blockId] || []).push(a);
  }
  var hintsByBlock = {};
  for (var j = 0; j < hints.length; j++) {
    var h = hints[j];
    (hintsByBlock[h.blockId] = hintsByBlock[h.blockId] || []).push(h);
  }

  return blocks.map(function (block) {
    return { id: block.id, segs: buildBlockSegs(block, annsByBlock[block.id] || EMPTY, hintsByBlock[block.id] || EMPTY) };
  });
}

function buildBlockSegs(block, anns, hintList) {
  var out = [];
  var chars = Array.from(block.text);

  // break positions
  var breakAt = {};
  for (var i = 0; i < anns.length; i++) {
    var b = anns[i];
    if (b.type === 'break') {
      breakAt[b.start] = b;
    }
  }

  // hint lookup (monotonic pointer)
  var hintPtr = 0;
  var hintTextAt = function (idx) {
    if (hintList.length === 0) {
      return null;
    }
    while (hintPtr < hintList.length && hintList[hintPtr].end <= idx) hintPtr++;
    var h = hintList[hintPtr];
    return h && idx >= h.start ? h.text : null;
  };

  // phoneme lookup
  var phonemeList = anns.filter(function (a) { return a.type === 'phoneme'; })
    .sort(function (x, y) { return x.start - y.start; });
  var phonemePtr = 0;
  var phonemeAt = function (idx) {
    if (phonemeList.length === 0) {
      return null;
    }
    while (phonemePtr < phonemeList.length && phonemeList[phonemePtr].end <= idx) phonemePtr++;
    var a = phonemeList[phonemePtr];
    return a && idx >= a.start ? a : null;
  };

  // bracket slots
  var bracketsAt = {};
  var ranged = anns.filter(function (a) {
    return a.type !== 'break' && a.type !== 'phoneme' && rangeFeatureEnabled(a.type);
  });
  for (var r = 0; r < ranged.length; r++) {
    var ra = ranged[r];
    ['left', 'right'].forEach(function (side) {
      var pos = side === 'left' ? ra.start : ra.end;
      (bracketsAt[pos] = bracketsAt[pos] || []).push({ ann: ra, side: side });
    });
  }
  var sortBracketSlots = function (slots) {
    return slots.slice().sort(function (a, b) {
      if (a.side !== b.side) {
        return a.side === 'right' ? -1 : 1;
      }
      var lenA = a.ann.end - a.ann.start;
      var lenB = b.ann.end - b.ann.start;
      return a.side === 'left' ? lenB - lenA : lenA - lenB;
    });
  };

  var bracketChar = function (type, side) {
    if (type === 'prosody') {
      return side === 'left' ? '[' : ']';
    }
    if (type === 'emphasis') {
      return side === 'left' ? '{' : '}';
    }
    if (type === 'sayAs') {
      return side === 'left' ? '(' : ')';
    }
    return '';
  };
  var bracketClass = function (type) {
    if (type === 'prosody') {
      return 'prosody';
    }
    if (type === 'emphasis') {
      return 'emphasis';
    }
    return 'sayAs';
  };

  var i = 0;
  while (i < chars.length) {
    var slots = bracketsAt[i];
    if (slots) {
      var rights = slots.filter(function (s) { return s.side === 'right'; });
      for (var ri = 0; ri < rights.length; ri++) {
        var rs = sortBracketSlots(rights)[ri];
        out.push(makeSeg({ k: 'b', ch: bracketChar(rs.ann.type, 'right'), c: bracketClass(rs.ann.type) }));
      }
    }
    var bk = breakAt[i];
    if (bk) {
      out.push(makeSeg({ k: 'bk' }));
    }

    if (slots) {
      var lefts = slots.filter(function (s) { return s.side === 'left'; });
      for (var li = 0; li < lefts.length; li++) {
        var ls = sortBracketSlots(lefts)[li];
        out.push(makeSeg({ k: 'b', ch: bracketChar(ls.ann.type, 'left'), c: bracketClass(ls.ann.type) }));
      }
    }

    var hint = hintTextAt(i);
    if (hint) {
      var j = i + 1;
      while (j < chars.length && hintTextAt(j) === hint) j++;
      // collect raw text of the hint range (inner annotations still possible)
      var innerModel = {
        blocks: [{ id: block.id, text: chars.slice(i, j).join('') }],
        annotations: anns.map(function (a) {
          return a.start >= i && a.start < j || (a.end > i && a.end <= j)
            ? {
                id: a.id, type: a.type, blockId: block.id,
                start: Math.max(0, a.start - i), end: Math.min(j - i, a.end - i),
                attrs: a.attrs,
              }
            : null;
        }).filter(Boolean),
        hints: [],
      };
      out.push(makeSeg({
        k: 'h',
        hint: hint,
        segs: buildBlockSegs({ id: block.id, text: chars.slice(i, j).join('') }, innerModel.annotations, []),
      }));
      i = j;
    } else {
      var py = phonemeAt(i);
      if (py) {
        out.push(makeSeg({ k: 'c', ch: chars[i], py: py.attrs.val || '' }));
      } else {
        // merge plain run
        var run = chars[i];
        var n = i + 1;
        while (n < chars.length) {
          var nSlots = bracketsAt[n];
          var nBk = breakAt[n];
          var nPy = phonemeAt(n);
          var nHint = hintTextAt(n);
          if (nSlots || nBk || nPy || nHint) {
            break;
          }
          run += chars[n];
          n++;
        }
        out.push(makeSeg({ k: 't', s: run }));
        i = n;
        continue;
      }
      i++;
    }
  }

  var trailing = bracketsAt[chars.length];
  if (trailing) {
    for (var ti = 0; ti < trailing.length; ti++) {
      var ts = sortBracketSlots(trailing)[ti];
      out.push(makeSeg({ k: 'b', ch: bracketChar(ts.ann.type, 'right'), c: bracketClass(ts.ann.type) }));
    }
  }
  return out;
}

/**
 * Convenience: ssmlToSegments(ssmlString) -> [{ id, segs }]
 */
function ssmlToSegments(ssmlString) {
  return modelToSegments(core.ssmlToModel(ssmlString));
}

/**
 * Split a CMS article body (HTML with embedded SSML blocks) into render parts.
 * Mirrors the Aine frontend (SsmlContent.vue): the TinyMCE "SSML" plugin saves
 * each SSML block as
 *   <div class="ssml-block" contenteditable="false" data-ssml='{JSON model}' > ... </div>
 * where single quotes inside the JSON are escaped as &#39;.
 *
 * Returns [{ k:'html', html }, { k:'ssml', model }] in document order.
 * The ssml-block element is located by its exact opening tag, and its end is
 * found by counting nested <div> / </div> pairs (the preview markup itself
 * contains nested divs).
 */
function extractSsmlBlocks(html) {
  var parts = [];
  var src = html || '';
  var i = 0;
  var OPEN = '<div class="ssml-block"';

  while (i < src.length) {
    var idx = src.indexOf(OPEN, i);
    if (idx === -1) {
      break;
    }
    if (idx > i) {
      parts.push({ k: 'html', html: src.slice(i, idx) });
    }
    // find the end of this block by counting div nesting
    var depth = 0;
    var j = idx;
    var re = /<div\b|<\/div>/g;
    re.lastIndex = idx;
    var m;
    while ((m = re.exec(src)) !== null) {
      if (m[0] === '<div') {
        depth++;
      } else {
        depth--;
        if (depth === 0) {
          j = m.index + m[0].length;
          break;
        }
      }
    }
    if (depth !== 0) {
      // unbalanced markup: keep the rest as plain html and stop
      parts.push({ k: 'html', html: src.slice(idx) });
      return parts;
    }
    var blockHtml = src.slice(idx, j);
    var dm = blockHtml.match(/data-ssml='([^']*)'/);
    if (dm) {
      var json = dm[1].replace(/&#39;/g, "'");
      try {
        var model = JSON.parse(json);
        parts.push({ k: 'ssml', model: model });
      } catch (e) {
        parts.push({ k: 'html', html: blockHtml });
      }
    } else {
      parts.push({ k: 'html', html: blockHtml });
    }
    i = j;
  }
  if (i < src.length) {
    parts.push({ k: 'html', html: src.slice(i) });
  }
  if (parts.length === 0 && src) {
    parts.push({ k: 'html', html: src });
  }
  return parts;
}

module.exports = {
  modelToSegments: modelToSegments,
  ssmlToSegments: ssmlToSegments,
  extractSsmlBlocks: extractSsmlBlocks,
};
