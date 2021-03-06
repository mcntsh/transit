;(function(window) {

  var cache;
  var utilities;
  var options;
  var defaults;
  var dom;
  var hist;

  var history = window.history;

  var loadNewContent;
  var extractContextFromContent;
  var placeNewContent;
  var initPushState;

  cache = {
    url   : null,
    title : null,
  };

  utilities = {
    noop: function() {},
    isInternalLink: function(url) {
      var externalPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
      var internalPattern = new RegExp('//' + location.host + '($|/)', 'i');

      if(!url) return false;

      return !(externalPattern.test(url) && !internalPattern.test(url));
    },
    isHash: function(url) {
      var hasPathname = (url.indexOf(window.location.pathname) > 0) ? true : false;
      var hasHash     = (url.indexOf('#') > 0) ? true : false;

      return (hasPathname && hasHash) ? true : false;
    },
    objectExtend: function(obj1, obj2) {
      var obj3 = {};

      for(var attr in obj1) {
        obj3[attr] = (obj2[attr]) ? obj2[attr] : obj1[attr];
      }

      return obj3;
    },
    getRequest: function(url, successCB, errorCB, loadingCB) {
      var responseObject = { success: false, content: null };
      var request;

      request = new XMLHttpRequest();
      request.open('GET', url, true);

      request.addEventListener('progress', (loadingCB || utilities.noop), false);
      request.onload  = function() {
        if(request.status  >= 200 && request.status < 400) {
          (successCB || utilities.noop).call(this, request);
        } else {
          (errorCB || utilities.noop).call(this, request);
        }
      };

      request.send();
    },
    middleware: function(fn, params, callback) {
      params = (params instanceof Array) ? params : [params];

      var nextFn = function() { this() };

      params.push(nextFn.bind(callback || utilities.noop));

      fn.apply(null, params);
    }
  };

  dom = {
    find: function(scope, selector, all) {
      all = (typeof all === 'boolean') ? all : false;

      if(all) {
        return (scope || document).querySelectorAll(selector);
      } else {
        return (scope || document).querySelector(selector);
      }
    },
    bind: function($target, type, callback, useCapture) {
      if($target.constructor.name === 'NodeList') {
        for(var i = 0; i < $target.length; i++) {
          dom.bind($target[i], type, callback, useCapture);
        }
      } else if($target instanceof HTMLElement) {
        $target.addEventListener(type, callback, !!useCapture);
      }
    },
    unbind: function($target, type, callback, useCapture) {
      if($target.constructor.name === 'NodeList') {
        for(var i = 0; i < $target.length; i++) {
          dom.unbind($target[i], type, callback, useCapture);
        }
      } else if($target instanceof HTMLElement) {
        $target.removeEventListener(type, callback, !!useCapture);
      }
    },
    parent: function($element, tagName) {
      if(!$element.parentNode) { return; }
      if($element.parentNode.tagName.toLowerCase() === tagName.toLowerCase()) {
        return $element.parentNode;
      }

      return dom.parent($element.parentNode, tagName);
    },
    insertBefore: function($targetElement, $elementToInsert) {
      var $targetParent = $targetElement.parentNode;

      if(!$targetParent) { return; }

      $targetParent.insertBefore($targetElement, $elementToInsert);
    },
  };

  hist = {
    handlePopState: function(event) {
      if(!event.state) { return; }

      document.title = event.state.title;

      loadNewContent(null, document.location.href, false);
    },
    handlePushState: function(title) {
      document.title = title
    },
    push: function(title, path) {
      history.pushState({ title : title }, title, path);

      hist.handlePushState(title);
    },
  };

  defaults = {
    context : document.getElementsByTagName('body')[0],
    beforeLoad: function(url, next) {
      next();
    },
    duringLoad: utilities.noop,
    afterLoad: function(url, content, next) {
      next();
    },
    beforeAppend: function($newContent, $oldContent, next) {
      next();
    },
    afterAppend: function($newContent, next) {
      next();
    },
    done: utilities.noop
  };

  loadNewContent = function(event, link, pushState) {
    var $link    = this;
    var linkHref = link || $link.href;

    if(!utilities.isInternalLink(linkHref)) {
      return;
    }

    if(event) {
      if(event.metaKey === true) return;

      event.preventDefault();
    }

    var makeRequest = function() {
      utilities.getRequest(linkHref, function(request) {
        var $newContent = extractContextFromContent(request.responseText);
        var callback    = placeNewContent.bind(null, $newContent);

        cache.url = linkHref;

        if(pushState !== false) {
          hist.push(cache.title, cache.url);
        }

        utilities.middleware(options.afterLoad, [linkHref, $newContent], callback);
      }, function() {
        document.location.href = linkHref;
      }, options.duringLoad);
    };

    utilities.middleware(options.beforeLoad, linkHref, makeRequest);
  };

  extractContextFromContent = function(htmlString) {
    var $tempHTMLContainer;
    var $context;

    $tempHTMLContainer           = document.createElement('div');
    $tempHTMLContainer.innerHTML = htmlString;

    $context    = dom.find($tempHTMLContainer, '#' + options.context.id);
    $context.id = $context.id + '--temp';

    cache.title = dom.find($tempHTMLContainer, 'title').innerText;

    delete $tempHTMLContainer;

    return $context;
  };

  placeNewContent = function($newContent) {
    var appendNewContent;
    var updatePage;

    appendNewContent = function() {
      options.context.innerHTML = $newContent.innerHTML;

      delete $newContent;

      utilities.middleware(options.afterAppend, [options.context], updatePage);
    };

    updatePage = function() {
      var $links  = dom.find(document, 'a', true);

      dom.bind($links, 'click', loadNewContent);

      utilities.middleware(options.done);
    };

    utilities.middleware(options.beforeAppend, [$newContent, options.context], appendNewContent);
  };

  initPushState = function() {
    if(!history.pushState) { return false; }

    window.onpopstate = hist.handlePopState;

    hist.push(dom.find(document, 'title').innerText, document.location.href);

    return true;
  };


  function Transit(opts) {
    var $links;

    if(!initPushState()) { return false; }

    opts    = opts || {};
    options = utilities.objectExtend(defaults, opts);
    $links  = dom.find(document, 'a', true);

    dom.bind($links, 'click', loadNewContent);

    return {
      bind: function($links) {
        dom.bind($links, 'click', loadNewContent);
      },
      destroy: function() {
        dom.unbind($links, 'click', loadNewContent);
      }
    };

  }

  // Expose to window object
  window.transit = Transit;

})(this);
