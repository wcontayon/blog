const metalsmith = require('metalsmith');
const metallic = require('metalsmith-metallic');
const drafts = require('metalsmith-drafts');
const discoverPartials = require('metalsmith-discover-partials');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const handlebars = require('handlebars');
const groupBy = require('handlebars-group-by');
const collections = require('metalsmith-collections');
const yearly_pagination  = require('metalsmith-yearly-pagination');
const permalinks = require('metalsmith-permalinks');
const serve = require('metalsmith-serve');
const watch = require('metalsmith-watch');
const assets = require('metalsmith-assets');
const pagination  = require('metalsmith-pagination');
const tags = require('metalsmith-tags');
const excerpts = require('metalsmith-excerpts');

handlebars.registerHelper('moment', require('helper-moment'));
handlebars.registerHelper(groupBy(handlebars));
handlebars.registerHelper('limit', function(collection, limit, start) {
  var out   = [],
      i, c;

  start = start || 0;

  for (i = c = 0; i < collection.length; i++) {
      if (i >= start && c < limit+1) {
          out.push(collection[i]);
          c++;
      }
  }

  return out;
});

var logPlugin = function(files, metalsmith, done) {
  // console.log(files);
  console.log(metalsmith);
  done();
};


metalsmith(__dirname)
  .metadata({
    site: {
      name: 'Adom',
      description: "Blog about Microsoft technologies (.NET, .NET Core, ASP.NET Core, Azure, etc.)",
      prefixLink: 'blog/'
    }
  })
  .source('./src')
  .destination('./docs')
  .use(drafts())
  .use(collections({
    articles:{
      pattern: 'articles/**/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(pagination({
    'collections.articles': {
      perPage: 5,
      layout:'index.hbs',
      first: 'index.html',
      path: 'page/:num/index.html',
      pageMetadata: {
        title: 'Archive'
      }
    }
  }))
  .use(yearly_pagination({ path: 'archives/year' }))
  .use(discoverPartials())
  .use(metallic())
  .use(markdown())
  .use(excerpts({ multipleFormat: true }))
  .use(permalinks({
    relative: false,
    pattern: ':title',
  }))
  .use(tags({
    // yaml key for tag list in you pages
    handle: 'tags',
    // path for result pages
    path:'topics/:tag.html',
    // layout to use for tag listing
    layout:'tag.hbs',
    // Can also use `template` property for use with the (deprecated)
    // metalsmith-templates plugin. The `template` property is deprecated here
    // as well but still available for use.
    // template:'/partials/tag.hbt',
    // ------
    // Normalize special characters like ØçßÜ to their ASCII equivalents ocssü
    // makes use of the value assigned to the 'slug' property below
    normalize: true,
    // provide posts sorted by 'date' (optional)
    sortBy: 'date',
    // sort direction (optional)
    reverse: true,
    // skip updating metalsmith's metadata object.
    // useful for improving performance on large blogs
    // (optional)
    skipMetadata: false,
    // Use a non-default key in the metadata. Useful if you you want to
    // have two sets of tags in different sets with metalsmith-branch.
    metadataKey: "category",
    // Any options you want to pass to the [slug](https://github.com/dodo/node-slug) package.
    // Can also supply a custom slug function.
    // slug: function(tag) { return tag.toLowerCase() }
    slug: {mode: 'rfc3986'}
  }))
  .use(layouts({
    engine: 'handlebars',
    directory: './layouts',
    pattern: ["*/*/*html","*/*html","*html"],
    default: 'article.hbs',
    suppressNoFilesError: false,
  }))
  .use(assets({
    source: './layouts/assets',
    destination: './assets'
  }))
  .use(logPlugin)
  .build(function (err) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('Blog built!');
    }
  });