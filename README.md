# Transit.js

A simple drop-in library for providing a refreshless browsing experience within a website using the [history.pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history) API. Transit has no dependencies, it works seemlessly with the HTML5 history API, and is only 3KB minified.

## What is it for?

Transit gives you the toolset needed to provide users with a refresh-less browsing experience. Hard refreshes create a jaring user experience, but this library allows the developer to smooth it out by giving them control of the full request process.

## How does it work?

Transit automatically detects inbound links and attempts to load them into the current page context via AJAX. The *page context* is an element which contains the changing content of your site (usually the `<main>` tag).

```javascript
  window.pjaxer = transit({
    context: document.getElementById('main-container'),
    beforeLoad: function(url, next) {
      console.log(url + ' was requested!');
      next();
    },
    duringLoad: function(event) {
      console.log(event.progress + '%..');
    },
    afterLoad: function(link, newContent, next) {
      console.log(link + ' loaded.');
      next();
    },
    beforeAppend: function(newContent, oldContent, next) {
      console.log('New content is about to replace the old content.');
      next();
    },
    afterAppend: function(newContent, next) {
      console.log('New content appended!);
      next();
    },
    done: function(url) {
      console.log('Title and web address have been updated.');
    }
  });
```

