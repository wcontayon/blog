# metalsmith-commento

[![npm version](https://badge.fury.io/js/metalsmith-commento.svg)](https://badge.fury.io/js/metalsmith-commento)
[![npm](https://img.shields.io/npm/dt/metalsmith-commento.svg)](https://github.com/vitaliy-bobrov/metalsmith-commento)

  A Metalsmith plugin that adds [Commento](https://commento.io/) commenting widget and counter scripts.

## Installation

    $ npm install --save-dev metalsmith-commento

## Usage

Place `metalsmith-commento` plugin after html files generation, for example after `metalsmith-layouts`.

```js
const Metalsmith = require('metalsmith');
const commento = require('metalsmith-commento');

Metalsmith(__dirname)
  ...
  .use(commento({
    cssOverride: 'https://my-blog.com/my-styles.css',
    autoInit: false,
    idRoot: 'comments-block',
    counterSelector: '.comments-counter'
  }));
```

  In your templates you need to add `<div id="commento"></div>` for commenting widget. For comments counter add link to the post with `commento-counter` class name.

  Examples:

  Page with comments template using handlebars:
  ```xml
  <p>Your page markup<p>
  {{#if comments }}
  <!-- Comments widget will be rendered in this element -->
  <div id="commento"></div>
  {{/if}}
  ```

  Page with counters template using handlebars:
  ```xml
  <p>Your page markup<p>

  {{#if comments }}
  <!-- Comments counter will be rendered in this element -->
  <a href="https://my-blog.com/my-post" class="commento-counter"></a>
  {{/if}}
  ```

  To enable comments for page just add `comments: true` to page metadata.
    Example:

  ```yaml
  ---
  title: Hello World
  comments: true
  ---
  ```

  To enable comments counter for page just add `comments-counter: true` to page metadata.
    Example:

  ```yaml
  ---
  title: Post
  comments-counter: true
  ---
  ```

## Options

For the detailed description of options look at the [Commento docs](https://docs.commento.io/configuration/frontend/).

### cssOverride
  Type: String

  Default: null

  Path to the commento CSS overrides.

### autoInit
  Type: Boolean

  Default: true

  Whether commento should be initialized automatically after script load.

### idRoot
  Type: String

  Default: 'commento'

  CSS selector string used to find the element in a template to insert comments.

### counterSelector
  Type: String

  Default: '.commento-counter'

  CSS selector string used to find links in a template to insert comments counter.

#### CLI

  You can also use the plugin with the Metalsmith CLI by adding a key to your `metalsmith.json` file:

```json
{
  "plugins": {
    "metalsmith-commento": {
      "cssOverride": "https://my-blog.com/my-styles.css",
      "autoInit": false,
      "idRoot": "comments-block",
      "counterSelector": ".comments-counter"
    }
  }
}
```

## License

  MIT
