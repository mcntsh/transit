;(function(window) {

  var cache;
  var utilities;
  var options;
  var defaults;
  var dom;

  cache = {
    url   : null,
    title : null,
    html  : null,
  };

  utilities = {
    noop: function() {},
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
    getRequest: function(url, successCB, errorCB, loadingCB) {
      var responseObject = { success: false, content: null };
      var request;

      request = new XMLHttpRequest();
      request.open('GET', url, true);

      request.addEventListener('progress', (loadingCB || utilities.noop), false);
      request.onload  = function() {
        if(request.status  >= 200 && request.status < 400) {
          (successCB || utilities.noop).call(this, request);
        }
      };
      request.onerror = (errorCB || utilities.noop).bind(null, request);

      request.send();
    },
    middleware: function(fn, params, callback) {
      var nextFn = function() { this() };

      params.push(nextFn.bind(callback) || utilities.noop);

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

  defaults = {
    anchors   : 'a',
    contextId : 'transit-context',
    beforeLoad: function(url, next) {
      next();
    },
    duringLoad: function(event) {
      // loading...
    },
    afterLoad: function(url, content, next) {
      next();
    },
    beforeAppend: function($newContent, $oldContent, next) {
      console.log('do something before append...');
      next();
    },
    afterAppend: function($newContent, next) {
      console.log($newContent);
      next();
    },
    done: function(url) {
      // woohoo!!
    }
  };

  var loadNewContent = function(event) {
    var $link    = this;
    var linkHref = $link.href;

    event.preventDefault();

    if(utilities.isInternalLink($link.href)) {
      utilities.getRequest(linkHref, function(request) {
        var $newContent = extractContextFromContent(request.responseText);

        placeNewContent($newContent);
      });
    }
  };

  var extractContextFromContent = function(htmlString) {
    var $tempHTMLContainer;
    var $context;

    $tempHTMLContainer           = document.createElement('div');
    $tempHTMLContainer.innerHTML = htmlString;

    $context    = dom.find($tempHTMLContainer, '#' + options.contextId);
    $context.id = $context.id + '--temp';

    delete $tempHTMLContainer;

    return $context;
  };

  var placeNewContent = function($newContent) {
    var $context = dom.find(document, '#' + options.contextId);
    var appendNewContent;
    var updatePage;

    appendNewContent = function() {
      $context.innerHTML = $newContent.innerHTML;

      delete $newContent;

      utilities.middleware(options.afterAppend, [$context], updatePage);
    };

    updatePage = function() {
      console.log('wühüü c:');
    };

    utilities.middleware(options.beforeAppend, [$newContent, $context], appendNewContent);
  };


  function Transit(opts) {
    var $links;

    opts    = opts || {};
    options = utilities.objectExtend(defaults, opts);
    $links  = dom.find(document, 'a', true);

    dom.bind($links, 'click', loadNewContent);
  }

  // Expose to window object
  window.transit = Transit;

})(this);
