const metalsmith = require('metalsmith');
const metallic = require('metalsmith-metallic');
const discoverPartials = require('metalsmith-discover-partials');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const handlebars = require('handlebars');
const collections = require('metalsmith-collections');
const permalinks = require('metalsmith-permalinks');
const serve = require('metalsmith-serve');
const watch = require('metalsmith-watch');
const assets = require('metalsmith-assets');
const paginate  = require('metalsmith-paginate');

handlebars.registerHelper('moment', require('helper-moment'));

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

metalsmith(__dirname)
  .metadata({
    site: {
      name: 'Adom',
      description: "Blog about Microsoft technologies (.NET, .NET Core, ASP.NET Core, Azure, etc.)"
    }
  })
  .source('./src')
  .destination('./public')
  .use(collections({
    articles:{
      metadata:{
        slug: 'articles',
      },
      pattern: 'articles/**/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(paginate({
    perPage: 10,
  }))
  .use(discoverPartials())
  .use(metallic())
  .use(markdown())
  .use(permalinks({
    relative: false,
    pattern: ':title',
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
  .use(serve({
    port: 8081,
    verbose: true
  }))
  .use(watch({
      paths: {
        "${source}/**/*": true,
        "layouts/**/*": "**/*",
      }
    }))
  .build(function (err) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('Blog built!');
    }
  });