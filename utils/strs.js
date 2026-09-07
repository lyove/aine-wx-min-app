
const strs = {
  /**
   * Add ARTICLE content tag class
   */
  addTagClass: function (str = '') {
    // Block Elements - HTML 5
    const blocks = ["address", "article", "aside", "audio", "blockquote", "button", "canvas", "center", "code", "dd", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "iframe", "li", "map", "menu", "noframes", "ol", "output", "p", "pre", "section", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "video"];

    // Inline Elements - HTML 5
    const inlines = ["a", "abbr", "acronym", "b", "basefont", "bdo", "big", "cite", "del", "dfn", "em", "font", "i", "ins", "kbd", "label", "map", "q", "s", "samp", "select", "small", "span", "strike", "strong", "sub", "sup", "textarea", "tt", "u", "var", "ruby", "rt"];

    // Single tag Element 
    const singles = ["area", "br", "embed", "hr", "img", "input"];
    // Tags
    const doubles = blocks.concat(inlines);
    let newStr = str;
    doubles.forEach(d => {
      newStr = newStr.replace(new RegExp(`<${d}>`, 'g'), `<${d} class="rich-text-${d}">`)
    });
    singles.forEach(s => {
      newStr = newStr.replace(new RegExp(`<${s} \/>`, 'g'), `<${s} class="rich-text-${s}" />`)
    });
    return newStr;
  }
};
export default strs;