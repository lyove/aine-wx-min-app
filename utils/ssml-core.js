/**
 * ssml-core.js
 * Runs in WeChat Mini Program (no document / DOMParser available).
 * API: ssmlToModel(xml) -> { blocks, annotations, hints }, ssmlToPlain(xml), modelToPlain(model)
 */

// ---------------------------------------------------------------------------
// tiny ids
// ---------------------------------------------------------------------------
function rand36(len) {
  var s = '';
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.slice(0, len);
}
var uidCounter = 0;
function uid() {
  uidCounter += 1;
  return 'ann-' + Date.now().toString(36) + '-' + rand36(8) + '-' + uidCounter.toString(36);
}
function createBlockId() {
  return 'seb-' + Date.now().toString(36) + '-' + rand36(8);
}

// ---------------------------------------------------------------------------
// HTML/XML entity decoding (replaces the DOM textarea trick)
// ---------------------------------------------------------------------------
var ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'",
};
function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, function (m, name) {
    if (ENTITY_MAP[name] !== undefined) {
      return ENTITY_MAP[name];
    }
    if (name.charAt(0) === '#') {
      var code = name.charAt(1).toLowerCase() === 'x'
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      if (!isNaN(code) && code >= 0 && code <= 0x10ffff) {
        try { return String.fromCodePoint(code); } catch (e) { return m; }
      }
    }
    return m;
  });
}

// ---------------------------------------------------------------------------
// tiny XML parser (elements + text, attrs with single/double quotes)
// ---------------------------------------------------------------------------
function parseXML(input) {
  var i = 0;
  var len = input.length;
  var root = null;
  var stack = [];

  function error(msg) {
    throw new Error('SSML parse error: ' + msg + ' at ' + i);
  }

  function skipUntilTag() {
    var start = i;
    while (i < len && input.charAt(i) !== '<') i++;
    if (i > start) {
      return { type: 'text', text: decodeEntities(input.slice(start, i)) };
    }
    return null;
  }

  function parseAttrs(s) {
    var attrs = {};
    var re = /([^\s=\/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    var m;
    while ((m = re.exec(s)) !== null) {
      attrs[m[1]] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
    }
    return attrs;
  }

  while (i < len) {
    var t = skipUntilTag();
    if (t) {
      if (stack.length === 0) error('text outside root');
      stack[stack.length - 1].children.push(t);
      continue;
    }
    // at '<'
    if (input.startsWith('<!--', i)) {
      var end = input.indexOf('-->', i + 4);
      if (end < 0) error('unterminated comment');
      i = end + 3;
      continue;
    }
    if (input.startsWith('<![CDATA[', i)) {
      var cend = input.indexOf(']]>', i + 9);
      if (cend < 0) error('unterminated CDATA');
      var cdata = input.slice(i + 9, cend);
      if (stack.length > 0) stack[stack.length - 1].children.push({ type: 'text', text: cdata });
      i = cend + 3;
      continue;
    }
    if (input.startsWith('<?', i)) {
      var pend = input.indexOf('?>', i + 2);
      if (pend < 0) error('unterminated PI');
      i = pend + 2;
      continue;
    }
    if (input.startsWith('<!', i)) {
      var dend = input.indexOf('>', i + 2);
      if (dend < 0) error('unterminated DOCTYPE');
      i = dend + 1;
      continue;
    }

    // closing tag
    if (input.charAt(i + 1) === '/') {
      var cgt = input.indexOf('>', i + 2);
      if (cgt < 0) error('unterminated closing tag');
      var cname = input.slice(i + 2, cgt).trim();
      if (stack.length === 0) error('unexpected closing ' + cname);
      var top = stack.pop();
      if (top.tag !== cname) error('mismatched closing </' + cname + '> for <' + top.tag + '>');
      i = cgt + 1;
      continue;
    }

    // opening tag (maybe self-closing)
    var gt = input.indexOf('>', i + 1);
    if (gt < 0) {
      error('unterminated tag');
    }
    var inner = input.slice(i + 1, gt);
    var selfClose = false;
    if (inner.charAt(inner.length - 1) === '/') {
      selfClose = true;
      inner = inner.slice(0, -1);
    }
    var nameMatch = inner.match(/^\s*([^\s\/]+)/);
    if (!nameMatch) {
      error('bad tag');
    }
    var tag = nameMatch[1];
    var attrs = parseAttrs(inner.slice(nameMatch[0].length));
    var node = { type: 'element', tag: tag, attrs: attrs, children: [] };
    if (stack.length === 0) {
      if (root !== null) error('multiple roots');
      root = node;
    } else {
      stack[stack.length - 1].children.push(node);
    }
    i = gt + 1;
    if (!selfClose) {
      stack.push(node);
    }
  }

  if (stack.length > 0) {
    error('unclosed tag <' + stack[stack.length - 1].tag + '>');
  }
  if (!root) {
    error('no root element');
  }
  return root;
}

// ---------------------------------------------------------------------------
// pinyin tone utilities (ported from utils/tone.ts)
// ---------------------------------------------------------------------------
var STRIP_MAP = { 'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a', 'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o', 'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e', 'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i', 'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u', 'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü' };
var TONE_MAP = { 'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4, 'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4, 'ē': 1, 'é': 2, 'ě': 3, 'è': 4, 'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4, 'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4, 'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4 };
var TONE_VOWELS = { a: ['ā', 'á', 'ǎ', 'à'], o: ['ō', 'ó', 'ǒ', 'ò'], e: ['ē', 'é', 'ě', 'è'], i: ['ī', 'í', 'ǐ', 'ì'], u: ['ū', 'ú', 'ǔ', 'ù'], 'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'], v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'] };

function stripTone(pinyin) {
  return Array.from(pinyin).map(function (ch) { return STRIP_MAP[ch] || ch; }).join('');
}
function detectTone(pinyin) {
  for (var i = 0; i < pinyin.length; i++) {
    var t = TONE_MAP[pinyin.charAt(i)];
    if (t) {
      return t;
    }
  }
  return 0;
}
function findToneIndex(letters) {
  var s = letters.toLowerCase();
  var idxA = s.indexOf('a'); if (idxA >= 0) {
    return idxA;
  }
  var idxO = s.indexOf('o'); if (idxO >= 0) {
    return idxO;
  }
  var idxE = s.indexOf('e'); if (idxE >= 0) {
    return idxE;
  }
  var idxIu = s.indexOf('iu'); if (idxIu >= 0) {
    return idxIu + 1;
  }
  var idxUi = s.indexOf('ui'); if (idxUi >= 0) {
    return idxUi + 1;
  }
  var idxI = s.indexOf('i'); if (idxI >= 0) {
    return idxI;
  }
  var idxU = s.indexOf('u'); if (idxU >= 0) {
    return idxU;
  }
  var idxV = s.indexOf('v'); if (idxV >= 0) {
    return idxV;
  }
  var idxUmlaut = s.indexOf('ü'); if (idxUmlaut >= 0) {
    return idxUmlaut;
  }
  return -1;
}
function applyTone(letters, tone) {
  var clean = stripTone(letters.trim().toLowerCase());
  if (!clean) {
    return '';
  }
  if (tone <= 0) {
    return clean;
  }
  var idx = findToneIndex(clean);
  if (idx < 0) {
    return clean;
  }
  var voiced = TONE_VOWELS[clean.charAt(idx)];
  if (!voiced) {
    return clean;
  }
  return clean.slice(0, idx) + voiced[Math.min(tone, 4) - 1] + clean.slice(idx + 1);
}
function parsePinyin(pinyin) {
  var s = (pinyin || '').trim().toLowerCase();
  if (!s) {
    return { letters: '', tone: 0 };
  }
  var num = s.match(/^(.*?)([1-5])$/);
  if (num && /^[a-züv]+$/.test(num[1])) {
    var t = Number(num[2]);
    return { letters: stripTone(num[1]), tone: t === 5 ? 0 : t };
  }
  return { letters: stripTone(s), tone: detectTone(s) };
}
function pinyinFormats(letters, tone) {
  var toneNum = Math.min(Math.max(tone, 0), 4);
  return {
    val: applyTone(letters, toneNum),
    tone: toneNum > 0 ? stripTone(letters) + toneNum : stripTone(letters),
  };
}

// ---------------------------------------------------------------------------
// range nesting normalization (ported from utils/annotations.ts)
// ---------------------------------------------------------------------------
function normalizeRangeNesting(annotations) {
  var breaks = annotations.filter(function (a) { return a.type === 'break'; });
  var nonBreaks = annotations.filter(function (a) { return a.type !== 'break'; });

  var byBlock = {};
  for (var i = 0; i < nonBreaks.length; i++) {
    var a = nonBreaks[i];
    if (a.type === 'phoneme') {
      continue;
    }
    (byBlock[a.blockId] = byBlock[a.blockId] || []).push(Object.assign({}, a));
  }

  var piecesById = {};
  Object.keys(byBlock).forEach(function (blockId) {
    var blockRanges = byBlock[blockId];
    var sorted = blockRanges.slice().sort(function (x, y) {
      return x.start - y.start || y.end - x.end;
    });
    for (var j = 0; j < sorted.length; j++) {
      var current = sorted[j];
      var cuts = {};
      for (var k = 0; k < sorted.length; k++) {
        var other = sorted[k];
        if (other.start < current.start && current.start < other.end && other.end < current.end) {
          cuts[other.end] = true;
        }
      }
      var cutList = Object.keys(cuts).map(Number).sort(function (x, y) { return x - y; });
      if (cutList.length === 0) {
        piecesById[current.id] = [current];
        continue;
      }
      var pieces = [];
      var groupId = current.groupId || current.id;
      var start = current.start;
      for (var p = 0; p < cutList.length; p++) {
        var end = cutList[p];
        if (end > start) {
          pieces.push(Object.assign({}, current, { id: uid(), groupId: groupId, start: start, end: end }));
        }
        start = Math.max(start, end);
      }
      if (start < current.end) {
        pieces.push(Object.assign({}, current, { id: uid(), groupId: groupId, start: start, end: current.end }));
      }
      piecesById[current.id] = pieces;
    }
  });

  var out = breaks.slice();
  for (var m = 0; m < nonBreaks.length; m++) {
    var aa = nonBreaks[m];
    if (aa.type === 'phoneme') {
      out.push(Object.assign({}, aa));
      continue;
    }
    var ps = piecesById[aa.id] || [Object.assign({}, aa)];
    out.push.apply(out, ps);
  }
  return out;
}

// ---------------------------------------------------------------------------
// ssmlToModel (ported from utils/ssml.ts, DOMParser replaced by parseXML)
// ---------------------------------------------------------------------------
function clampInt(v, lo, hi) {
  return Math.max(lo, Math.min(v, hi));
}

function ssmlToModel(xml) {
  var blocks = [];
  var annotations = [];
  var hints = [];
  var cur = { id: createBlockId(), text: '' };

  var flush = function () {
    var blockId = cur.id;
    var trimmed = cur.text.trim();
    var lead = Array.from(cur.text).length - Array.from(cur.text.trimStart()).length;
    var trimmedLen = Array.from(trimmed).length;
    cur.text = trimmed;
    for (var i = 0; i < annotations.length; i++) {
      var a = annotations[i];
      if (a.blockId !== blockId) {
        continue;
      }
      if (a.type === 'break') {
        a.start = clampInt(a.start - lead, 0, trimmedLen);
        a.end = a.start;
      } else {
        a.start = clampInt(a.start - lead, 0, trimmedLen);
        a.end = clampInt(a.end - lead, 0, trimmedLen);
      }
    }
    for (var j = 0; j < hints.length; j++) {
      var h = hints[j];
      if (h.blockId !== blockId) {
        continue;
      }
      h.start = clampInt(h.start - lead, 0, trimmedLen);
      h.end = clampInt(h.end - lead, 0, trimmedLen);
    }
    if (trimmed.length > 0 || blocks.length === 0) {
      blocks.push(cur);
    }
    cur = { id: createBlockId(), text: '' };
  };

  var walk = function (node, openRanges) {
    if (node.type === 'text') {
      var t = node.text || '';
      if (/^\s*$/.test(t)) return;
      cur.text += t;
      return;
    }
    var tag = node.tag.toLowerCase();
    if (tag === 'p' || tag === 's') {
      flush();
      node.children.forEach(function (c) { walk(c, openRanges); });
      flush();
      return;
    }
    if (tag === 'break') {
      var attrs = {};
      if (node.attrs.time) attrs.time = node.attrs.time;
      if (node.attrs.strength) attrs.strength = node.attrs.strength;
      var offset = Array.from(cur.text).length;
      var existing = annotations.some(function (a) {
        return a.type === 'break' && a.blockId === cur.id && a.start === offset;
      });
      if (!existing) {
        annotations.push({ id: uid(), type: 'break', blockId: cur.id, start: offset, end: offset, attrs: attrs });
      }
      node.children.forEach(function (c) { walk(c, openRanges); });
      return;
    }
    if (tag === 'phoneme') {
      var ph = node.attrs.ph || '';
      var start = Array.from(cur.text).length;
      node.children.forEach(function (c) { walk(c, openRanges); });
      var end = Array.from(cur.text).length;
      var spanLen = end - start;
      if (spanLen <= 1) {
        var p = parsePinyin(ph);
        var fmt = pinyinFormats(p.letters, p.tone);
        annotations.push({
          id: uid(), type: 'phoneme', blockId: cur.id, start: start, end: end,
          attrs: { val: fmt.val, tone: /[1-5]$/.test(ph.trim()) ? ph.trim() : fmt.tone },
        });
      } else {
        var readings = ph.split(/\s+/).filter(Boolean);
        var count = Math.min(spanLen, readings.length);
        for (var i = 0; i < count; i++) {
          var raw = readings[i];
          var pp = parsePinyin(raw);
          var ff = pinyinFormats(pp.letters, pp.tone);
          var s = start + i;
          annotations.push({
            id: uid(), type: 'phoneme', blockId: cur.id, start: s, end: s + 1,
            attrs: { val: ff.val, tone: /[1-5]$/.test(raw.trim()) ? raw.trim() : ff.tone },
          });
        }
      }
      return;
    }

    var opened = null;
    if (tag === 'hint') {
      var hintText = (node.attrs.text || '').trim();
      var hintStart = Array.from(cur.text).length;
      node.children.forEach(function (c) { walk(c, openRanges); });
      var hintEnd = Array.from(cur.text).length;
      if (hintText && hintEnd > hintStart) {
        hints.push({ id: uid(), blockId: cur.id, start: hintStart, end: hintEnd, text: hintText });
      }
      return;
    }
    if (tag === 'prosody') {
      var pAttrs = {};
      ['rate', 'pitch', 'volume'].forEach(function (k) {
        if (node.attrs[k]) pAttrs[k] = node.attrs[k];
      });
      opened = {
        ann: { id: uid(), type: 'prosody', blockId: cur.id, start: 0, end: 0, attrs: pAttrs },
        start: Array.from(cur.text).length,
      };
    } else if (tag === 'say-as') {
      opened = {
        ann: {
          id: uid(), type: 'sayAs', blockId: cur.id, start: 0, end: 0,
          attrs: Object.assign(
            { interpretAs: node.attrs['interpret-as'] || node.attrs.interpretAs || 'characters' },
            node.attrs.format ? { format: node.attrs.format } : {}
          ),
        },
        start: Array.from(cur.text).length,
      };
    } else if (tag === 'emphasis') {
      opened = {
        ann: { id: uid(), type: 'emphasis', blockId: cur.id, start: 0, end: 0, attrs: { level: node.attrs.level || 'moderate' } },
        start: Array.from(cur.text).length,
      };
    }

    var stack = opened ? openRanges.concat([opened]) : openRanges;
    node.children.forEach(function (c) { walk(c, stack); });

    if (opened) {
      annotations.push(Object.assign({}, opened.ann, {
        start: opened.start,
        end: Array.from(cur.text).length,
      }));
    }
  };

  var dom = null;
  try {
    dom = parseXML(xml);
    walk(dom, []);
  } catch (e) {
    blocks.length = 0;
    annotations.length = 0;
    hints.length = 0;
    var text = xml.replace(/<[^>]+>/g, '');
    text = decodeEntities(text);
    cur = { id: createBlockId(), text: text };
  }
  flush();

  var liveBlocks = blocks.filter(function (b) { return b.text.length > 0; });
  var liveIds = {};
  liveBlocks.forEach(function (b) { liveIds[b.id] = true; });
  var cleaned = [];
  for (var i2 = 0; i2 < annotations.length; i2++) {
    var a2 = annotations[i2];
    if (!liveIds[a2.blockId]) {
      continue;
    }
    var blk = null;
    for (var bi = 0; bi < liveBlocks.length; bi++) {
      if (liveBlocks[bi].id === a2.blockId) {
        blk = liveBlocks[bi]; break;
      }
    }
    var len = Array.from(blk.text).length;
    if (a2.type === 'break') {
      var pos = clampInt(a2.start, 0, len);
      cleaned.push(Object.assign({}, a2, { start: pos, end: pos }));
      continue;
    }
    var start2 = clampInt(a2.start, 0, len);
    var end2 = clampInt(a2.end, 0, len);
    if (end2 <= start2) {
      continue;
    }
    cleaned.push(Object.assign({}, a2, { start: start2, end: end2 }));
  }
  var cleanedHints = [];
  var hintIndex = {};
  for (var h2 = 0; h2 < hints.length; h2++) {
    var hh = hints[h2];
    if (!liveIds[hh.blockId]) {
      continue;
    }
    var hblk = null;
    for (var hbi = 0; hbi < liveBlocks.length; hbi++) {
      if (liveBlocks[hbi].id === hh.blockId) {
        hblk = liveBlocks[hbi]; break;
      }
    }
    var hlen = Array.from(hblk.text).length;
    var hs = clampInt(hh.start, 0, hlen);
    var he = clampInt(hh.end, 0, hlen);
    if (he <= hs) {
      continue;
    }
    var key = hh.blockId + ':' + hs + ':' + he;
    if (hintIndex[key] === undefined) {
      hintIndex[key] = cleanedHints.length;
      cleanedHints.push(Object.assign({}, hh, { start: hs, end: he }));
    } else {
      cleanedHints[hintIndex[key]] = Object.assign({}, hh, { start: hs, end: he });
    }
  }
  return {
    blocks: liveBlocks,
    annotations: normalizeRangeNesting(cleaned),
    hints: cleanedHints,
  };
}

function modelToPlain(model) {
  return model.blocks.map(function (b) { return b.text; }).join('\n');
}

function ssmlToPlain(xml) {
  return modelToPlain(ssmlToModel(xml));
}

module.exports = {
  ssmlToModel: ssmlToModel,
  ssmlToPlain: ssmlToPlain,
  modelToPlain: modelToPlain,
  parseXML: parseXML,
  decodeEntities: decodeEntities,
  parsePinyin: parsePinyin,
  pinyinFormats: pinyinFormats,
  uid: uid,
  createBlockId: createBlockId,
};
