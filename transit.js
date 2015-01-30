;(function(window) {

  var
    // Global module cache.
    cache = {
      url   : null,
      title : null,
      html  : null,
    },

    // Global module utility methods.
    utilities = {
      isInternalLink: function(url) {
        var externalPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
        var internalPattern = new RegExp('//' + location.host + '($|/)', 'i');

        return !(externalPattern.test(url) && !internalPattern.test(url));
      },
      isHash: function(url) {
        var hasPathname = (url.indexOf(window.location.pathname) > 0) ? true : false;
        var hasHash     = (url.indexOf("#") > 0) ? true : false;

        return (hasPathname && hasHash) ? true : false;
      },
      objectExtend: function(obj1, obj2) {
        var obj3 = {};

        for(var attr in obj1) {
          obj3[attr] = (obj2[attr]) ? obj2[attr] : obj1[attr];
        }

        return obj3;
      },
      bubbleElement: function($element, type) {

      },
      ajaxRequest: function(url, callback) {
        var responseObject = { success: false, content: null };
        var request;

        if(!utilities.isInternalLink(url)) { return responseObject; }

        request = new XMLHttpRequest();
        request.open('GET', url, true);

        request.onload = callback;

        request.send();
      },
    },

    // Module default options
    options = {},
    defaults = {
      anchors   : 'a',
      contextId : '#transit-context',
      beforeLoad: function(url, next) {
        next();
      },
      afterLoad: function(url, content, next) {
        next();
      },
      beforeAppend: function(loadedContent, existingContent, next) {
        loadedContent.style.display = 'none';
        next();
      },
      afterAppend: function(loadedContent, existingContent, next) {
        existingContent.style.display = 'none';
        loadedContent.style.display   = 'block';
        next();
      },
      done: function(url) {
        // woohoo!!
      }
    },

    watchInboundLinks = function($links) {
      var $filteredLinks = [];

      for(var i = 0; i < $links.length; i++) {
        if($links[i].href && utilities.isInternalLink($links[i].href)) {
          // Attach the `dispatchLinkEvent` method to the link
          $links[i].addEventListener('click', fetchNewPage);

          // Add the link to the filtered list
          $filteredLinks.push($links[i]);
        }
      }

      return $filteredLinks;
    },

    fetchNewPage = function(event) {
      var $element;
      var linkAddress;

      event.preventDefault();

      $element = event.target;
      if($element.nodeName !== 'A') {
        $
      }
      linkAddress = $element.href;

      var sendRequest = function() {
        utilities.ajaxRequest(linkAddress, function() {
          var response = this;

          if(response.readyState === 4) {
            if(response.status >= 200 && response.status < 400) {
              if(cachePageContent(linkAddress, response.responseText)) {
                options.afterLoad.call($element, linkAddress, response.responseText, swapPageContent); // Middleware
              }
            }
          }
        });
      };

      options.beforeLoad.call($element, linkAddress, sendRequest); // Middleware
    },

    cachePageContent = function(url, content) {
      var $content       = (document).createElement('div');
      $content.innerHTML = content;

      cache.title = $content.querySelector('title').text;
      cache.html  = $content.querySelector(options.contextId);
      cache.url   = url;

      if(typeof cache.title === 'null' || cache.html === 'null' || cache.url === 'null') {
        clearCache();
        return false;
      }

      return true;
    },

    swapPageContent = function() {
      var $tempContextCont = (document).createElement('div');
      var $currentContext  = (document).querySelector(options.contextId);

      var appendNewContent = function() {
        $currentContext.parentNode.insertBefore($tempContextCont, $currentContext.nextSibling);
        options.afterAppend.call({}, $tempContextCont, $currentContext, updateDocumentAttributes);
      };

      var updateDocumentAttributes = function() {
        document.title = cache.title;
        window.history.pushState(null, null, cache.url);

        cleanupTempHtml();
      };

      var cleanupTempHtml = function() {
        var $newContext = $tempContextCont.querySelector(options.contextId);

        $newContext.parentNode.parentNode.insertBefore($newContext, $tempContextCont);

        $currentContext.parentNode.removeChild($currentContext);
        $tempContextCont.parentNode.removeChild($tempContextCont);

        resetTransit($newContext);
      };

      var resetTransit = function($newContext) {
        var url = cache.url;

        watchInboundLinks($newContext.querySelectorAll('a'));
        clearCache();

        options.done.call({}, url, $newContext);
      };

      $tempContextCont.id = 'temp--transit-context';
      $tempContextCont.appendChild(cache.html);

      options.afterAppend.call({}, $tempContextCont, $currentContext, appendNewContent); // Middleware
    },

    clearCache = function() {
      for(i in cache) {
        if(cache.hasOwnProperty(i)) { cache[i] = null; }
      }
    };

  function Transit(opts) {
    var $links = watchInboundLinks((document).querySelectorAll('a'));

    opts = opts || {};

    options = utilities.objectExtend(defaults, opts);
  }

  // Expose to window object
  window.transit = Transit;

})(this);
