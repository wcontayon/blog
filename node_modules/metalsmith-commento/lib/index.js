const debug = require('debug')('metalsmith-commento');
const cheerio = require('cheerio');

const DEFAULTS = {
  cssOverride: null,
  autoInit: true,
  idRoot: 'commento',
  counterSelector: `.commento-counter`
};

const loadContent = contents => cheerio.load(contents, {decodeEntities: false});

const insertTemplate = (template, $contents) => {
  $contents('body').append(template);

  return $contents;
};

const insertCounters = (selector, contents) => {
  let $ = insertTemplate(
    '<script src="https://cdn.commento.io/js/count.js"></script>', contents);

  $(selector).each((_, el) => {
    const href = $(el).attr('href');

    if (!href) return;

    $(el).attr('href', `${href}#commento`);
  });

  return $;
};

const toHtml = $ => $.html();

/**
 * Metalsmith plugin to add Commento comments and counter widgets.
 * @return {Function}
 */
const plugin = options => {
  options = Object.assign({}, DEFAULTS, options);

  return (files, metalsmith, done) => {
    setImmediate(done);

    Object.keys(files).forEach(file => {
      let data = files[file];
      let modifiedContent = false;

      if (data.comments) {
        const cssOverride = options.cssOverride ?
          `data-css-override="${options.cssOverride}"` : '';
        const autoInit = options.autoInit ? '' : 'data-auto-init="false"';
        const idRoot = options.idRoot && options.idRoot !== 'commento' ?
          `data-id-root="${options.idRoot}"` : '';
        const template = `<script defer
          src="https://cdn.commento.io/js/commento.js"
          ${cssOverride}
          ${autoInit}
          ${idRoot}></script>`;

        modifiedContent = insertTemplate(
          template, modifiedContent || loadContent(data.contents));

        debug('add commento comments to file: %O', data);
      }

      if (data['comments-counter']) {
        modifiedContent = insertCounters(
          options.counterSelector, modifiedContent || loadContent(data.contents));

        debug('add commento counter to file: %O', data);
      }

      if (modifiedContent) {
        data.contents = new Buffer.from(toHtml(modifiedContent));
      }
    });
  };
};

module.exports = plugin;
