var EDM = window.EDM || {};

EDM.jsonp = (function(global) {
    'use strict';

    var callbackId = 0,
        documentHead = document.head || document.getElementsByTagName('head')[0];

    function createScript(url) {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('async', true);
        script.setAttribute('src', url);
        return script;
    }

    return function(options) {
        options = options || {};

        var callbackName = 'callback' + (++callbackId),
            url = options.url + '&callback=EDM.' + callbackName + (options.cache ? '' : '&_dc=' + new Date().getTime()),
            script = createScript(url),
            abortTimeout;

        function cleanup() {
            if (script) {
                script.parentNode.removeChild(script);
            }
            clearTimeout(abortTimeout);
            delete global[callbackName];
        }

        function success(data) {
            if (typeof options.success === 'function') {
                options.success(data);
            }
        }

        function error(errorType) {
            if (typeof options.error === 'function') {
                options.error(errorType);
            }
        }

        function abort(errorType) {
            cleanup();
            if (errorType === 'timeout') {
                global[callbackName] = function() {};
            }
            error(errorType);
        }

        global[callbackName] = function(data) {
            cleanup();
            success(data);
        };

        script.onerror = function() {
            abort('error');
        };

        documentHead.appendChild(script);

        if (options.timeout > 0) {
            abortTimeout = setTimeout(function() {
                abort('timeout');
            }, options.timeout);
        }

    };

}(EDM));

(function(global) {
    'use strict';
    // define global namespace
    var EDM = global.EDM = global.EDM || {};


/**
 * Observable mixin
 * @class Observable
 * @namespace EDM
 * @example
 *     // create constructor
 *     var Widget = function() {
 *       // make the widget observable
 *       // Observable.call(Widget.prototype);
 *       Observable.call(this);
 *       // test method
 *       this.test = function(data) {
 *         this.trigger('test', data);
 *       }
 *     };
 *     // create new instance of the Widget
 *     var widget = new Widget();
 *     // add event listener
 *     widget.on('test', function(data) {
 *         console.log(data);
 *     });
 *     // test
 *     widget.test('lorem ipsum'); // => writes to console "lorem ipsum"
 * @return {Function}
 */
 EDM.Observable = (function() {

    /**
     * List of events
     * @property _events
     * @private
     * @type {Object}
     */
    var _events = {};

    /**
     * Binds a callback function to an object. The callback will be invoked whenever the event is fired.
     * @method on
     * @example
     *     // External usage example:
     *     widget.on('change:make', function(makeId) {
     *         // this code is executed when the change event is fired by the widget
     *     });
     *
     *     // Internal usage example:
     *     this.on('change:make', function(makeId) {
     *         // this code is executed when the change event is fired by the widget
     *     });
     * @param {String} event The event name
     * @param {Function} callback The callback function
     * @param {Object} [context] The context object
     * @chainable
     */
    function on(name, callback, context) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('The event name must be a string and not be empty.');
        }
        if (typeof callback !== 'function') {
            throw new Error('The callback must be a function.'); 
        }
        (_events[name] || (_events[name] = [])).push({
            callback: callback,
            context: context
        });
    }

    /**
     * Removes a previously-bound callback function from an object. If no event name is specified, all callbacks will be removed.
     * @method off
     * @example
     *     // External usage example:
     *     widget.off('change:make');
     *
     *     // Internal usage example:
     *     this.off('change:make');
     * @param {String} [event] The event name
     * @chainable
     */
    function off(name) {
        if (typeof name !== 'string' || name.length === 0) {
            _events = {};
            return this;
        }
        _events[name] = [];
    }

    /**
     * Trigger callbacks for the given event. Subsequent arguments to trigger will be passed along to the event callbacks.
     * @method trigger
     * @example
     *     this.trigger('change:make', makeId);
     * @param {String} event The event name
     * @param {Function} [arg*] The arguments
     * @chainable
     */
    function trigger(name) {
        var args, list, length, i, event;
        if (!name || !_events[name]) {
            return;
        }
        args = slice.call(arguments, 1);
        list = _events[name];
        length = list.length;
        for (i = 0; i < length; i++) {
            event = list[i];
            event.callback.apply(event.context, args);
        }
    }

    return function() {
        this.on = on;
        this.off = off;
        this.trigger = trigger;
        return this;
    };

}());

    // Utils
    /**
    * This module contains classes for running a store.
    * @class util
    * @example
    *
    * @namespace EDM
    */
    (function() {
        var util = EDM.Util = {},
            // prototypes
            arrayProto = Array.prototype,
            functionProto = Function.prototype,
            objectProto = Object.prototype,
            // shortcuts
            hasOwnProp = objectProto.hasOwnProperty,
            nativeBind = functionProto.bind,
            nativeIsArray = Array.isArray,
            nativeIndexOf = arrayProto.indexOf,
            slice = arrayProto.slice,
            toString = objectProto.toString;

        /**
         * Bind a function to an object.
         * @method bind
         * @param {Function} fn
         * @param {Object} obj
         * @return {Function}
         * @example
         *      var obj = {},           // Some object
         *          fn = function(){    // Some function
         *              return this;
         *          };
         *      EDM.Util.bind(fn, obj);
         */
        util.bind = function(fn, obj) {
            if (fn.bind === nativeBind && nativeBind) {
                return nativeBind.apply(fn, slice.call(arguments, 1));
            }
            return function() {
                return fn.apply(obj, slice.call(arguments));
            };
        };

        /**
         * Returns true if the value is present in the list.
         * @method contains
         * @param {Array} list
         * @param {Object} key
         * @return {Boolean}
         * @example
         *      var array = [96, 97, 98, 99, 100, 101, 102, 103, 104, 105], // Array
         *          key = 100;                                              // Numder or string
         *      EDM.Util.contains(array, key); // => true
         */
        util.contains = function(list, key) {
            var i, length;
            if (!util.isArray(list)) {
                return false;
            }
            if (nativeIndexOf && list.indexOf) {
                return list.indexOf(key) !== -1;
            }
            for (i = 0, length = list.length; i < length; i++) {
                if (list[i] === key) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Copy all of the properties in the source objects over to the destination object.
         * @method extend
         * @param {Object} destination
         * @param {Object} source
         * @return {Object}
         * @example
         *      EDM.Util.extend(object1, object2);
         */
        util.extend = function(obj) {
            var args = slice.call(arguments, 1),
                length = args.length,
                i, source, prop;
            for (i = 0; i < length; i++) {
                source = args[i];
                for (prop in source) {
                    if (hasOwnProp.call(source, prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
            return obj;
        };

        /**
         * Returns true if object is an Array.
         * @method isArray
         * @param {Object} obj
         * @return {Boolean}
         * @example
         *      EDM.Util.isArray([1990, 1999, 1996, 2010]); // => true
         */
        util.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        };

        util.isEmpty = function(source) {
            var prop;
            for (prop in source) {
                if (hasOwnProp.call(source, prop)) {
                    return false;
                }
            }
            return true;
        };

        /**
         * Renders options to HTMLSelectElement.
         * @method renderSelectOptions
         * @param {HTMLSelectElement} element
         * @param {Object} records
         * @param {Boolean} hasOptGroups
         * @return {HTMLSelectElement}
         * @example
         *      // for example element can be {HTMLSelectElement}
         *      EDM.Util.renderSelectOptions(element, {}, 'Select a Make');
         */
        util.renderSelectOptions = function(element, records, defaultText, hasOptGroups, styles) {
            var fragment = document.createDocumentFragment(),
                key, optgroup, options, option;
            // clear inner html
            if (element.innerHTML) {
                element.innerHTML = '';
            }
            // add default option
            if (defaultText) {
                option = document.createElement('option');
                option.innerHTML = defaultText;
                option.setAttribute('value', '');
                element.appendChild(option);
            }
            // render option groups
            if (hasOptGroups === true) {
                for (key in records) {
                    optgroup = document.createElement('optgroup');
                    optgroup.setAttribute('label', key);
                    options = util.renderSelectOptions(optgroup, records[key]);
                    fragment.appendChild(optgroup);
                }
                element.appendChild(fragment);
                return element;
            }
            // render options
            if (styles === true) {

                for (var i = 0; i < records.length; i++) {
                    option = document.createElement('option');
                    option.setAttribute('value', records[i][0]);
                    option.innerHTML = records[i][1];
                    fragment.appendChild(option);
                }
            } else {
                for (key in records) {
                    option = document.createElement('option');
                    option.setAttribute('value', key);
                    option.innerHTML = records[key];
                    fragment.appendChild(option);
                }
            }
            element.appendChild(fragment);
            return element;
        };

        /**
         * Finds and replaces all variables in template.
         * @method renderTemplate
         * @example
         *      EDM.Util.renderTemplate('<div><%= text %></div>', { text: 'test' }); // => <div>test</div>
         * @param {String} template
         * @param {Object} options
         * @return {String}
         */
        util.renderTemplate = function(text, options, useBraces) {
            var replacementsReg = useBraces ? /\{\{\s+\w+\s+\}\}/gi : /<%=\s+\w+\s+%>/gi,
                variableReg = useBraces ? /\{\{\s+|\s+\}\}/gi : /^<%=\s+|\s+%>$/gi,
                replacements, replacement, i, length, variableName;

            if (typeof text !== 'string') {
                throw new Error('template must be a string');
            }

            if (text.length === 0 || !options) {
                return text;
            }

            options = options || {};

            replacements = text.match(replacementsReg);
            length = replacements !== null ? replacements.length : 0;

            if (length === 0) {
                return text;
            }

            for (i = 0; i < length; i++) {
                replacement = replacements[i];
                variableName = replacement.replace(variableReg, '');
                text = text.replace(replacement, options[variableName]);
            }

            return text;
        };

    }());

    var $ = EDM.Util,
        slice = Array.prototype.slice,
        proto;

    /**
     * Base Widget Class
     * @constructor
     * @class Widget
     * @namespace EDM
     * @example
     *      // create new instance of the Widget
     *      var widget = new Widget();
     */
    var Widget = EDM.Widget = function(apiKey, options) {

        var
            /**
             * Vehicle API Key.
             * @property _apiKey
             * @private
             * @type {String}
             */
            _apiKey,

            /**
             * Base class name.
             * @property _baseClass
             * @private
             * @type {String}
             */
            _baseClass,

            /**
             * Base ID.
             * @property _baseId
             * @private
             * @type {String}
             */
            _baseId,

            /**
             * List of events.
             * @property _events
             * @private
             * @type {Object}
             */
            _events,

            /**
             * Base Options of widget.
             * @property _options
             * @private
             * @type {Object}
             */
            _options,

            /**
             * Root element of widget.
             * @property _rootElement
             * @private
             * @type {HTMLElement}
             */
            _rootElement;

        /**
         * Returns the API key.
         * @method getApiKey
         * @return {String}
         */
        this.getApiKey = function() {
            return _apiKey;
        };

        /**
         * Returns base class name.
         * @method getBaseClass
         * @return {String}
         */
        this.getBaseClass = function() {
            return _baseClass;
        };

        /**
         * Returns base Id.
         * @method getBaseId
         * @return {String}
         */
        this.getBaseId = function() {
            return _baseId;
        };

        /**
         * Returns a copy of the options to prevent the change.
         * @method getOptions
         * @return {Object}
         */
        this.getOptions = function() {
            return $.extend({}, _options);
        };

        /**
         * Returns a root element.
         * @method getRootElement
         * @return {Object}
         */
        this.getRootElement = function() {
            return _rootElement;
        };

        /**
         * Set a copy of the options to prevent the change.
         * @method setOptions
         * @return {Object}
         */
        this.setOptions = function(options) {
            _options = $.extend({}, _options, options);
        };

        /**
         * Configures the widget.
         * @private
         * @method _configure
         * @param {String} apiKey
         * @param {Object} options
         */
        function _configure(apiKey, options) {
            if (typeof apiKey !== 'string') {
                throw new Error('The API key must be a string.');
            }
            _apiKey = apiKey;
            this.setOptions(options);
            _baseClass = _options.baseClass || '';
            _baseId = 'edm' + new Date().getTime();
            // define root element
            _rootElement = document.getElementById(_options.root);
            if (_rootElement === null) {
                throw new Error('The root element was not found.');
            }
            _rootElement.className = _baseClass;
        }

        _configure.apply(this, arguments);

    };

    proto = Widget.prototype;

    proto.destroy = function() {
        var root = this.getRootElement();
        if (root !== null) {
            root.remove();
        }
    };

    EDM.Observable.call(proto);

/**
 * Core functionality for the Edmunds API JavaScript SDK
 *
 * @class EDMUNDSAPI
 */
function EDMUNDSAPI(key) {
	/**
	 * Assigned API Key. Register for an API Key <a href="http://developer.edmunds.com/apps/register">here</a>
	 *
	 * @config _api_key
	 * @private
	 * @type string
	 */
	var _api_key = key;
	/**
	 * The API version
	 *
	 * @config _api_version
	 * @private
	 * @type string
	 */
	var _api_version = "v1";
	/**
	 * The base URL for the API
	 *
	 * @property _base_url
	 * @private
	 * @type string
	 */
	var _base_url = "http://api.edmunds.com/";
	/**
	 * The base URL for the QA API
	 *
	 * @property _base_url_qa
	 * @private
	 * @type string
	 */
	var _base_url_qa = "http://widgets.edmunds.com";
	/**
	 * The API response format
	 *
	 * @property _response_format
	 * @private
	 * @type string
	 */
	var _response_format = 'json';
	/**
	 * The document HEAD element
	 *
	 * @property _head
	 * @private
	 * @type DOMElement
	 */
	var _head = document.getElementsByTagName('head')[0];

	/**
	 * The base URL for the API
	 *
	 * @method _serializeParams
	 * @private
	 * @param object JSON object of parameters and their values
	 * @return {string} Serialized parameters in the form of a query string
	 */
	function _serializeParams(params) {
		var str = '';
		for(var key in params) {
			if(params.hasOwnProperty(key)) {
				if (str !== '') str += "&";
		   		str += key + "=" + params[key];
			}
		}
		return str;
	}

	/**
	 * The base URL for the API
	 *
	 * @method getBaseUrl
	 * @param void
	 * @return {string} API URL stub
	 */
	this.getBaseUrl = function() {
		return _base_url + _api_version;
	};
	/**
	 * The base URL for the API
	 *
	 * @method getVersion
	 * @param void
	 * @return {string} API version
	 */
	this.getVersion = function() {
		return _api_version;
	};
	/**
	 * The base URL for the API
	 *
	 * @method setVersion
	 * @param void
	 * @return {string} API version
	 */
	this.setVersion = function(version) {
		_api_version = version;
		return _api_version;
	};
	/**
	 * Make the API REST call
	 *
	 * @method invoke
	 * @param string method The API method to be invoked
	 * @param object params JSON object of method parameters and their values
	 * @param function callback The JavaScript function to be invoked when the results are returned (JSONP implementation)
	 * @return {string} API REST call URL
	 */
	/*
	this.invoke = function(method, params, callback) {
		var qs = _serializeParams(params);
		var url = this.getBaseUrl();
		var uniq = 'cb'+new Date().getTime();
		EDMUNDSAPI[uniq] = callback;
		qs = (qs) ? '?' + qs + '&api_key=' + _api_key + "&fmt=" + _response_format : '?api_key=' + _api_key + "&fmt=" + _response_format;
		var rest_call = url + method + qs + "&callback=EDMUNDSAPI."+uniq;
		var js = document.createElement('script');
		js.type = 'text/javascript';
		js.src = rest_call;
		_head.appendChild(js);
		return rest_call;
	};
	*/
	this.invoke = function(method, params, successCallback, errorCallback) {
        var queryString = _serializeParams(params),
            baseUrl = this.getBaseUrl();
        queryString = (queryString) ? '?' + queryString + '&api_key=' + _api_key + "&fmt=" + _response_format : '?api_key=' + _api_key + "&fmt=" + _response_format;
        return EDM.jsonp({
            url: baseUrl + method + queryString,
            timeout: 7000,
            success: successCallback,
            error: errorCallback
        });
	};

	/**
	 * Make the API REST call
	 *
	 * @method invokeString
	 * @param string method The API method to be invoked
	 * @param object params JSON object of method parameters and their values
	 * @param function callback The JavaScript function to be invoked when the results are returned (JSONP implementation)
	 * @return {string} API REST call URL
	 */
	/*
	this.invokeString = function(method, params, callback) {
		var qs = _serializeParams(params);
		var url = this.getBaseUrl();
		var uniq = 'cbs'+new Date().getTime();
		EDMUNDSAPI[uniq] = callback;
		// if params is empty but we have '?' in url
		qs = (qs) ? qs + '&api_key=' + _api_key + "&fmt=" + _response_format : '&api_key=' + _api_key + "&fmt=" + _response_format;
		var rest_call = url + method + qs + "&callback=EDMUNDSAPI."+uniq;
		var js = document.createElement('script');
		js.type = 'text/javascript';
		js.src = rest_call;
		_head.appendChild(js);
		return rest_call;
	};
	*/
    this.invokeString = function(method, params, successCallback, errorCallback) {
        var queryString = _serializeParams(params),
            baseUrl = this.getBaseUrl();
        queryString = (queryString) ? queryString + '&api_key=' + _api_key + "&fmt=" + _response_format : '&api_key=' + _api_key + "&fmt=" + _response_format;
        return EDM.jsonp({
            url: baseUrl + method + queryString,
            timeout: 7000,
            success: successCallback,
            error: errorCallback
        });
    };

	/**
	 * Make the QA API REST call
	 *
	 * @method invoke
	 * @param string method The API method to be invoked
	 * @param object params JSON object of method parameters and their values
	 * @param function callback The JavaScript function to be invoked when the results are returned (JSONP implementation)
	 * @return {string} API REST call URL
	 */
    /*
	this.invoke_qa = function(method, params, callback) {
		var qs = _serializeParams(params);
		var uniq = 'cbq'+new Date().getTime();
		EDMUNDSAPI[uniq] = callback;
		// if params is empty but we have '?' in url
		qs = (qs) ? qs + '&api_key=' + _api_key + "&fmt=" + _response_format : '&api_key=' + _api_key + "&fmt=" + _response_format;
		var rest_call = _base_url_qa + method + qs + "&callback=EDMUNDSAPI."+uniq;
		var js = document.createElement('script');
		js.type = 'text/javascript';
		js.src = rest_call;
		_head.appendChild(js);
		return rest_call;
	}
	*/
    this.invoke_qa = function(method, params, successCallback, errorCallback) {
        var queryString = _serializeParams(params),
            baseUrl = this.getBaseUrl();
        queryString = (queryString) ? queryString + '&api_key=' + _api_key + "&fmt=" + _response_format : '&api_key=' + _api_key + "&fmt=" + _response_format;
        return EDM.jsonp({
            url: _base_url_qa + method + queryString,
            timeout: 7000,
            success: successCallback,
            error: errorCallback
        });
    };

}


}(this));