define([
	'jquery',
	'underscore',
	'backbone',
	'Session',
	'hammerjs',
	'uri/URI',
	'moodle.download',
	'pmodules/moodle/moodle.sso.login',
	'underscore.string',
	'cache'
], function($, _, Backbone, Session, Hammer, URI, MoodleDownload, moodleSso, _str){

	// Necessary IE workaround. See
	//
	// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
	//
	// for details
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		};
	}

	/*
	 * Template Loading Functions
	 */
	var rendertmpl = function(tmpl_name, tmpl_dir) {

	    if ( !rendertmpl.tmpl_cache ) {
	    	rendertmpl.tmpl_cache = {};
	    }

		    if ( ! rendertmpl.tmpl_cache[tmpl_name] ) {
	        tmpl_dir = tmpl_dir || 'js/templates';
	        var tmpl_url = tmpl_dir + '/' + tmpl_name + '.tmpl';
		        var tmpl_string;

	        $.ajax({
	            url: tmpl_url,
	            method: 'GET',
	            dataType: 'html',
	            async: false,
	            success: function(data) {
	                tmpl_string = data;
	            }
	        });

			tmpl_string = removeTabs(tmpl_string);
			rendertmpl.tmpl_cache[tmpl_name] = _.template(tmpl_string);
	    }
	    return function(params) {
	    	var templateFunction = rendertmpl.tmpl_cache[tmpl_name];
	    	if (params.store == undefined){
	    		params.store = LocalStore;
	    	}else{
	    		throw new error('Variable store already defined in function rendertmpl');
	    	}
	    	return templateFunction(params);
	    };
	};

	var renderheader = function(d){
		if ( !renderheader.headerTemplateLoaded ) {
			var tmpl_dir = 'js/templates';
			var tmpl_url = tmpl_dir + '/header.tmpl';
			var tmpl_string;

			$.ajax({
				url: tmpl_url,
				method: 'GET',
				dataType: 'html',
				async: false, //Synchron, also eigentlich nicht AJAX- sondern SJAX-Call
				success: function(data) {
					tmpl_string = data;
				}
			});

			renderheader.headerTemplateString = tmpl_string.replace(/\t/g, '');
			renderheader.headerTemplateLoaded = true;
		}
		d.settingsUrl = d.settingsUrl ? d.settingsUrl : false;
		d.back = d.back ? d.back : false;
		d.backCaption = d.backCaption ? d.backCaption : false;
		d.title = d.title ? d.title : '';
		d.klass = d.klass ? ' ' + d.klass : '';
		d.home = d.home ? d.home : false;
		d.store = LocalStore;
		return _.template(renderheader.headerTemplateString)(d);
	};

	var removeTabs = function(tmpl) {
		return tmpl.replace(/\t/g, '');
	};

	/*
 	 * Loading Spinner Animation
 	*/
 	// I think we should use a selector/ DOM element as argument
 	// instead of an id - Richard
	var addLoadingSpinner = function(uniqueDivId) {
		return function() {
			$("#" + uniqueDivId).append("<div class=\"up-loadingSpinner extensive-spinner\"> \
											<img src=\"img/loadingspinner.gif\"></img> \
										</div>");
		};
	};

	var removeLoadingSpinner = function(uniqueDivId) {
		return function() {
			$("#" + uniqueDivId + " .up-loadingSpinner").remove();
		}
	};

	/*
	 * Retreive authorization token
	 */
	var getAuthHeader = function() {
		return "Bearer c06156e119040a27a4b43fa933f130";
	};

	/**
	 *	Function to get network status using org.apache.cordova.network-information
	 */
	function checkOffline() {
		var networkState = navigator.connection.type;

		if (typeof Connection === "undefined")
			return false;

		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'No network connection';

		return (states[networkState] == states[Connection.NONE]) ? true : false;
	}


	/**
	 *	Error Model
	 */
	 var Error = Backbone.Model.extend({
	 	// default values for an error
	 	defaults: {
	 		msg: 'Es ist ein Fehler aufgetreten.',
	 		module: 'Modul nicht bekannt'
	 	},

	 	initialize: function(attributes){
	 		this.msg = attributes.msg;
	 		this.module = attributes.module;
	 		if (navigator.connection !== undefined){
	 			if (checkOffline()){
	 				this.error = 'Bitte prüfen Sie ihre Internetverbindung. Vermutlich sind Sie offline.'
	 			}else{
	 				this.error = attributes.error;
	 			}
	 		}
	 	}
	 });

	/**
	 *	Error View
	 */
	 var ErrorView = Backbone.View.extend({
		model: Error,

		events: {
			"click .error-reload": "reload"
		},

		initialize: function(options){
			this.hasReload = options.hasReload;

			error = new Error({msg: options.msg, module: options.module, error: options.err})
			this.template = rendertmpl('error');
			this.render();
		},

		empty: function() {
			this.$el.empty();
			this.stopListening();
			this.undelegateEvents();
			return this;
		},

		reload: function(ev) {
			ev.preventDefault();
			this.trigger("reload");
		},

		render: function(){
			this.$el.html(this.template({model: this.model, hasReload: this.hasReload}));
			this.$el.trigger("create");
			return this;
		}
	});

	var capitalize = function(string)
	{
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	/*
	* Betriebssystem/UserAgent ermitteln
	*/
	var detectUA = function($, userAgent) {
		// Fill in some details if necessary
		if (!window.device) {
			window.device = {
				platform: "browser",
				version: userAgent
			};
		}

		// Add flag for iOS 7 and higher
		var version = window.device.version.split(".");
		window.device.ios7 = window.device.platform === "iOS" && parseInt(version[0]) >= 7;
	};

	/**
	 * Loading View, that listens to a given model or collection.
	 * As long as the model is loading data from the server, a loading spinner is shown on the given element.
	 */
	var LoadingView = Backbone.View.extend({

		runningCounter: 0,

		initialize: function() {
			var subject = this.findSubject();
			if (subject){
				this.listenTo(subject, "request", this.spinnerOn);
				this.listenTo(subject, "cachesync", this.spinnerHold)
				this.listenTo(subject, "sync", this.spinnerOff);
				this.listenTo(subject, "error", this.spinnerOff);
			}
		},

		empty: function() {
			this.$el.empty();
			this.stopListening();
			return this;
		},

		findSubject: function() {
			if (this.model) {
				return this.model;
			} else if (this.collection) {
				return this.collection;
			} else {
				console.log("LoadingView needs a model or collection to work on. It didn't find one here.");
				return undefined;
			}
		},

		_miniSpinner: function() {
			this.$(".up-loadingSpinner").removeClass("extensive-spinner").addClass("compact-spinner");
		},

		spinnerOn: function(useMini) {
			this.runningCounter++;
			if (this.runningCounter == 1) {
				this.$el.append("<div class=\"up-loadingSpinner extensive-spinner\">" +
									"<img src=\"img/loadingspinner.gif\"></img>" +
								"</div>");

				// Make sure to check for "true" because the request event fills in a parameter but we only want to check for truth values
				if (useMini === true) this._miniSpinner();
			}
		},

		spinnerHold: function(model, attr, opts) {
			// backbone-fetch-cache is used, we should be aware of prefill requests
			if (opts.prefill) {
				this.runningCounter++;
				this._miniSpinner();
			}
		},

		spinnerOff: function() {
			this.runningCounter--;
			if (this.runningCounter <= 0) {
				this.$el.empty();
			}
		}
	});

	// At most one InAppBrowser window should be opened at any time
	var hasOpenInAppBrowser = false;

	var openInAppBrowser = function(url) {
		var openWindow = window.open(url, "_blank", "enableViewportScale=yes");
		// Always ensure user is logged into Moodle
		moodleSso.loginUser(new Session, openWindow);
		openWindow.addEventListener('exit', function(event) {
			hasOpenInAppBrowser = false;
		});
		openWindow.addEventListener('loadstart', function(event) {
			var url = event.url;
			if (MoodleDownload.isMoodleFileUrl(url)) {
				new MoodleDownload().openMoodleFileUrl(url);
			}
		});
	};

	var openInTab = function(url) {
		if (hasOpenInAppBrowser) {
			console.log("InAppBrowser open, " + url + " won't be opened");
		} else {
			hasOpenInAppBrowser = true;
		}
		openInAppBrowser(url);
	};

	/**
	 * Opens external links according to the platform we are on. For apps this means using the InAppBrowser, for desktop browsers this means opening a new tab.
	 */
	var overrideExternalLinks = function(e, removeActiveElementsOnCurrentPage) {
		var $this = $(e.currentTarget);
		var href = $this.attr('href') || '';
		var rel = $this.attr('rel') || false;
		var target = $this.attr('target');

		var url = ''+$(e.currentTarget).attr("href");
		var uri = new URI(url);

		var internalProtocols = ["http", "https"];
		var isInternalProtocol = internalProtocols.indexOf(uri.protocol()) >= 0;
		var isJavascript = uri.protocol().indexOf('javascript') >= 0;
		var hasProtocol = uri.protocol() !== '';

		// In the app we consider three cases:
		// 1. Protocol is empty (URL is relative): we let the browser handle it
		// 2. Protocol is http or https and URL is absolute: we let an InAppBrowser tab handle it
		// 3. Protocol is something other: we let the system handle it
		// In the browser, we let the browser handle everything
		if (/*window.cordova && */isInternalProtocol) {
			console.log("Opening " + uri + " in new tab");
			if(window.cordova) {
				openInTab(url);
				e.preventDefault();
				return false;
			} else {
				if(target != '_blank') {
					var openWindow = window.open(url, "_blank", "enableViewportScale=yes");
					e.preventDefault();
					return false;
				}
			}
		} else if (window.cordova && hasProtocol && !isInternalProtocol && !isJavascript) {
			console.log("Opening " + uri + " in system");
			window.open(url, "_system");
			e.preventDefault();
			return false;
		} else if(href && !isJavascript && rel != 'norout' && href != '#') {
			$this.addClass('ui-btn-active');
			removeActiveElementsOnCurrentPage();
			app.route(url);
			e.preventDefault();
			console.log("Opening " + url + " internally");
		} else if(rel == 'norout') {
			e.preventDefault();
		}
	};

	var getUniqueIdentifier = function() {
        var uuid = localStorage.getItem("user-uuid");
        if (!uuid) {
            uuid = uuid4();
            localStorage.setItem("user-uuid", uuid);
        }
        return uuid;
	};

	/**
	 * Generates a uuid v4. Code is taken from broofas answer in http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	 */
	var uuid4 = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	};

	/**
	 * Handles unhandled errors and prevents them from bubbling to the top
	 */
	var onError = function(errorMessage, errorUrl, lineNumber, columnNumber, error) {
		var info = new Backbone.Model;
		info.url = "https://api.uni-potsdam.de/endpoints/errorAPI/rest/log";
		info.set("uuid", getUniqueIdentifier());
		info.set("message", errorMessage);
		info.set("url", errorUrl);
		info.set("line", lineNumber);
		info.set("column", columnNumber);

		console.error("Unhandled error thrown", info.attributes, (error || {}).stack);

		info.on("error", function(error) {
			console.warn("Could not log error");
			console.warn(error.attributes);
		});

		info.save();

		return true;
	};

	var LocalStore = {

		get : function(key, empty){ //Objekt aus dem LocaStorage auslesen
			var it = localStorage.getItem(key);
			try {
				it = JSON.parse(it);
			} catch (e) {}
			if(it == undefined) {
				it = empty;
				if(empty != undefined)
					this.set(key, empty);
			}
			return it;
		},

		set : function(key, value, itemValue){ //Objekt im LocalStorage speichern
			if(itemValue) { //In einem gespeichert Objekt/Array eine Eigenschaft ändern, value ist dann das Objekt/Array und itemValue der Wert
				var k = value;
				value = this.get(key);
				if(!value)
					value = {};
				value[k] = itemValue;
			}
			localStorage.setItem(key, JSON.stringify(value));
		},

		val : function(key, value) { //Gibt den Wert für einen key zurück oder setzt ihn, je nach dem ob value angegeben ist
			if(value)
				localStorage.setItem(key, value);
			else
				localStorage.getItem(key);
		},

	};

	var GesturesView = Backbone.View.extend({

		delegateEventSplitter: /^(\S+)\s*(.*)$/,
		gestures: ["swipeleft", "swiperight"],
		gesturesCleanup: [],

		/**
		 * Code taken from original implementation
		 */
		delegateEvents: function(events) {
			if (!(events || (events = _.result(this, 'events')))) return this;
			this.undelegateEvents();
			for (var key in events) {
				var method = events[key];
				if (!_.isFunction(method)) method = this[events[key]];
				if (!method) continue;

				var match = key.match(this.delegateEventSplitter);
				var eventName = match[1], selector = match[2];
				method = _.bind(method, this);

				/** This block is new */
				if (_.contains(this.gestures, eventName)) {
					var elements = undefined;
					if (selector === '') {
						elements = this.$el.get();
					} else {
						elements = this.$(selector).get();
					}

					var that = this;
					$.each(elements, function(index, el) {
						var hammer = new Hammer(el);
						hammer.on(eventName, method);
						that.gesturesCleanup.push(function() { hammer.off(eventName); });
					});

					continue;
				}

				eventName += '.delegateEvents' + this.cid;
				if (selector === '') {
					this.$el.on(eventName, method);
				} else {
					this.$el.on(eventName, selector, method);
				}
			}
			return this;
		},

		/**
		 * Code taken from original implementation
		 */
		undelegateEvents: function() {
			this.$el.off('.delegateEvents' + this.cid);

			/** This block is new */
			for (var count = 0; count < this.gesturesCleanup.length; count++) {
				this.gesturesCleanup[count].apply(this);
			}
			this.gesturesCleanup = [];

			return this;
		},
	});

	var activateExtendedAjaxLogging = function() {
		$(document).ajaxError(function(event, jqHXR, ajaxSettings, thrownError) {
			console.log("Error handler activated");
			console.log(jqHXR.status + ": " + jqHXR.statusText);
			console.log(jqHXR.responseText);
			console.log("Thrown error: " + thrownError);
			console.log("URL: " + ajaxSettings.url);
			console.log("Authorization: " + ajaxSettings.headers["Authorization"]);
		});
	};

	// Hold cached data for five minutes, then do a background update
	var prefillExpires = 5 * 60;
	var cacheDefaults = function(opts) {
		var defaults = {cache: true, expires: false, prefill: true, prefillExpires: prefillExpires};
		if (opts) {
			return _.defaults(opts, defaults);
		} else {
			return defaults;
		}
	};

	/**
	 * Removes a cache entry if the given predicate function returns <true>
	 * @param predicate Removes given element on <true>. Parameters: element, url
	 */
	var cacheRemoveIf = function(predicate) {
		var cache = Backbone.fetchCache._cache;
		var result = {};

		for (var key in cache) {
			if (cache.hasOwnProperty(key) && !predicate(cache[key], key)) {
				result[key] = cache[key];
			}
		}

		Backbone.fetchCache._cache = result;
		Backbone.fetchCache.setLocalStorage();
	};

	/**
	 * Working around bug #480
	 * @param collectionOrModel
	 */
	var removeNonExpiringElements = function(collectionOrModel) {
		var faultyUrl = collectionOrModel.url;
		cacheRemoveIf(function(element, url) {
			return url.startsWith(faultyUrl) && !element.expires;
		});
	};

	var defaultTransition = function() {
		var device = window.device || {data: 'none'};
		if (device.platform === "ios" || device.platform === "iOS") {
			$.mobile.changePage.defaults.transition = "fade";
		} else {
			$.mobile.changePage.defaults.transition =  "slidefade";
		}

		return $.mobile.changePage.defaults.transition;
	};

	/**
	 * Override Backbone.sync to automatically include auth headers according to the url in use
	 */
	var overrideBackboneSync = function() {
		var authUrls = app.authUrls;
		var isStartOf = function(url) {
			return function(authUrl) {
				return _str.startsWith(url, authUrl);
			};
		};

		var sync = Backbone.sync;
		Backbone.sync = function(method, model, options) {
			var url = options.url || _.result(model, "url");
			if (url && _.any(authUrls, isStartOf(url))) {
				options.headers = _.extend(options.headers || {}, { "Authorization": getAuthHeader() });
			}
			return sync(method, model, options);
		};
	};

	var EmptyPage = Backbone.View.extend({
		render: function () {
			this.$el.html('');
			return this;
		}
	});

	var cacheModelsOnSync = function(collection, saveCallback) {
		var isCachedResponse = false;
		collection.listenTo(collection, "cachesync", function() {
			// The following sync event will deliver cached data
			isCachedResponse = true;
		});
		collection.listenTo(collection, "sync", function(collection, response, options) {
			// If we get cached data we don't want to cache the models
			if (isCachedResponse) {
				isCachedResponse = false;
				return;
			}

			// Start the profiling timer
			var start = new Date().getTime();

			// Deactivate localStorage caching for significantly better performance
			var localStorage = Backbone.fetchCache.localStorage;
			Backbone.fetchCache.localStorage = false;
			try {
				// Iterate over all models...
				for (i = 0; i < this.models.length; i++) {
					var cache = {
						model: this.models[i],
						options: options,
						index: i,
						response: {}
					};

					// ...and save each one separately
					saveCallback.call(this, cache);
					Backbone.fetchCache.setCache(cache.model, cache.options, cache.response);
				}
			} finally {
				// Restore localStorage caching
				Backbone.fetchCache.localStorage = localStorage;
				Backbone.fetchCache.setLocalStorage();
			}

			// Stop the profiling timer and output its result
			var end = new Date().getTime();
			console.log("SetCache took " + (end-start) + "ms");
		});
	};

	return {
			rendertmpl: rendertmpl,
			renderheader: renderheader,
			removeTabs: removeTabs,
			capitalize: capitalize,
			addLoadingSpinner: addLoadingSpinner,
			removeLoadingSpinner: removeLoadingSpinner,
			getAuthHeader: getAuthHeader,
			ErrorView: ErrorView,
			LoadingView: LoadingView,
			overrideExternalLinks: overrideExternalLinks,
			detectUA: detectUA,
        	getUniqueIdentifier: getUniqueIdentifier,
			onError: onError,
			LocalStore: LocalStore,
			GesturesView: GesturesView,
			activateExtendedAjaxLogging: activateExtendedAjaxLogging,
			cacheDefaults: cacheDefaults,
			cacheRemoveIf: cacheRemoveIf,
			removeNonExpiringElements: removeNonExpiringElements,
			defaultTransition: defaultTransition,
			overrideBackboneSync: overrideBackboneSync,
			EmptyPage: EmptyPage,
			cacheModelsOnSync: cacheModelsOnSync
		};
});