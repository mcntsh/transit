# Transit.js

A simple drop-in library for providing a refreshless browsing experience within a website using the [history.pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history) API.

## How does it work?

Transit automatically detects inbound links and attempts to load them into the current page context via AJAX. The *page context* is an element which contains the changing content of your site (usually the `<main>` tag).

## Function Reference

### `transit({ options })`

| Option | Description | Type
|--------|-------------|--------|
| **contextId** | The `id` of the element containing the changing content | `string`
| **beforeLoad** | Called before the link's page content is loaded via AJAX | `fn [url, next]`
| **duringLoad** | Called frequently (based on progress) during the AJAX request | `fn [event]`
| **afterLoad** | Called directly after the AJAX quest has been completed | `fn [url, context, next]`
| **beforeAppend** | Called before the new content replaces the old content | `fn [newContent, oldContent, next]`
| **afterAppend** | Called after the new content replaces the old content | `fn [newContent, oldContent, next]`
| **done** | Called after all tasks are done, and the title/pushState have been updated | `fn [url])`

### Example:

```Javascript
transit({
  contextId: 'site-container',
  beforeLoad: function(url, next) {
    console.log('pls wait while i load ' + url);
    $('body').fadeTo('slow', 0, next);
  },
  done: function(url) {
    $('body').fadeTo('slow', 0, function() {
      console.log('k thx');
    });
  }
})
```
