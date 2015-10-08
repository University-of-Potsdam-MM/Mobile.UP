define([
	'jquery',
	'underscore',
	'backbone',
	'Session',
	'hammerjs',
	'uri/URI',
	'moodle.download'
], function($, _, Backbone, Session, Hammer, URI, MoodleDownload){

	/*
	 * Template Loading Functions
	 */
	var rendertmpl = function(tmpl_name) {

	    if ( !rendertmpl.tmpl_cache ) {
	    	rendertmpl.tmpl_cache = {};
	    }

		    if ( ! rendertmpl.tmpl_cache[tmpl_name] ) {
	        var tmpl_dir = 'js/templates';
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
	
	/*
	 * Template Loading Function, Synchronous AJAX Calls are deprecated and should be replace by a async loading function like this one:
	 */
	var loadTemplates = function(tmpl_names) {
		var q = Q.defer();
		if (!rendertmpl.tmpl_cache) {
	    	rendertmpl.tmpl_cache = {};
	    }
		var tmpl_name = tmpl_names.shift();
		/*var renderObj = function(params) {
	    	var templateFunction = rendertmpl.tmpl_cache[tmpl_name];
	    	if (params.store == undefined){
	    		params.store = LocalStore;
	    	}else{
	    		throw new error('Variable store already defined in function rendertmpl');
	    	}
	    	return templateFunction(params);
	    };*/
		
		if ( !this.tmpl_cache[tmpl_name] ) {
			var tmpl_string;
			var _this = this;
			var tmpl_dir = 'templates';
	        var tmpl_url = tmpl_dir + '/' + tmpl_name + '.html';
			$.ajax({
				url: tmpl_url,
				method: 'GET',
				dataType: 'html',
				async: true, //Async da Sync deprecated
				success: function(data) {
					tmpl_string = data;
					tmpl_string = tmpl_string.replace(/\t/g, '');
					_this.tmpl_cache[tmpl_name] = _.template(tmpl_string);
					if(tmpl_names.length > 0) {
						utils.rendertmpl(tmpl_names).done(function(){
							q.resolve(_this.tmpl_cache[tmpl_name]);	
						});
					} else
						q.resolve(_this.tmpl_cache[tmpl_name]);
				}
			});
		} else
			q.resolve(this.tmpl_cache[tmpl_name]);
		return q.promise;
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
		return _.template(renderheader.headerTemplateString, d);
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

		initialize: function(options){
			error = new Error({msg: options.msg, module: options.module, error: options.err})
			this.template = rendertmpl('error');
			this.render();
		},

		render: function(){
			this.$el.html(this.template({model: this.model}));
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
		$.os = {};
		$.os.webkit = userAgent.match(/WebKit\/([\d.]+)/) ? true : false;
		$.os.android = userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) ? true : false;
		$.os.androidICS = $.os.android && userAgent.match(/(Android)\s4/) ? true : false;
		$.os.ipad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
		$.os.iphone = !$.os.ipad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
		$.os.ios7 = userAgent.match(/(iPhone\sOS)\s([789_]+)/) ? true : false;
		$.os.webos = userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/) ? true : false;
		$.os.touchpad = $.os.webos && userAgent.match(/TouchPad/) ? true : false;
		$.os.ios = $.os.ipad || $.os.iphone;
		$.os.playbook = userAgent.match(/PlayBook/) ? true : false;
		$.os.blackberry10 = userAgent.match(/BB10/) ? true : false;
		$.os.blackberry = $.os.playbook || $.os.blackberry10|| userAgent.match(/BlackBerry/) ? true : false;
		$.os.chrome = userAgent.match(/Chrome/) ? true : false;
		$.os.opera = userAgent.match(/Opera/) ? true : false;
		$.os.fennec = userAgent.match(/fennec/i) ? true : userAgent.match(/Firefox/) ? true : false;
		$.os.ie = userAgent.match(/MSIE 10.0/i) ? true : false;
		$.os.ieTouch = $.os.ie && userAgent.toLowerCase().match(/touch/i) ? true : false;
		$.os.supportsTouch = ((window.DocumentTouch && document instanceof window.DocumentTouch) || 'ontouchstart' in window);
		//features
		$.feat = {};
		var head = document.documentElement.getElementsByTagName("head")[0];
		$.feat.nativeTouchScroll = typeof(head.style["-webkit-overflow-scrolling"]) !== "undefined" && ($.os.ios||$.os.blackberry10);
		$.feat.cssPrefix = $.os.webkit ? "Webkit" : $.os.fennec ? "Moz" : $.os.ie ? "ms" : $.os.opera ? "O" : "";
		$.feat.cssTransformStart = !$.os.opera ? "3d(" : "(";
		$.feat.cssTransformEnd = !$.os.opera ? ",0)" : ")";
		if ($.os.android && !$.os.webkit)
			$.os.android = false;
	};

	/**
	 * Takes a model or collection ("subject") and triggers an event if the subject doesn't have any sync processes running in the background.
	 * This helps if you want to be sure that you don't work on previously cached data if a fetch for fresh data is still going on. The triggered event is named "fullysynced" and has the given subject as first parameter
	 */
	var FullySyncedAdapter = Backbone.Model.extend({

		runningCounter: 0,

		initialize: function(properties, options) {
			this.subject = options.subject;

			this.listenTo(this.subject, "request", this.spinnerOn);
			this.listenTo(this.subject, "cachesync", this.spinnerHold)
			this.listenTo(this.subject, "sync", this.spinnerOff);
			this.listenTo(this.subject, "error", this.spinnerOff);
		},

		spinnerOn: function() {
			this.runningCounter++;
		},
		
		spinnerHold: function(model, attr, opts) {
			// backbone-fetch-cache is used, we should be aware of prefill requests
			if (opts.prefill) {
				this.runningCounter++;
			}
		},

		spinnerOff: function() {
			this.runningCounter--;
			if (this.runningCounter <= 0) {
				this.trigger("fullysynced", this.subject);
			}
		}
	});

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

		spinnerOn: function() {
			this.runningCounter++;
			if (this.runningCounter == 1) {
				this.$el.append("<div class=\"up-loadingSpinner extensive-spinner\">" +
									"<img src=\"img/loadingspinner.gif\"></img>" +
								"</div>");
			}
		},
		
		spinnerHold: function(model, attr, opts) {
			// backbone-fetch-cache is used, we should be aware of prefill requests
			if (opts.prefill) {
				this.runningCounter++;
				this.$(".up-loadingSpinner").removeClass("extensive-spinner").addClass("compact-spinner");
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
		
		var moodlePage = "https://moodle2.uni-potsdam.de/";
		if (url.indexOf(moodlePage) != -1){
			var session = new Session();

			window.plugins.toast.showShortBottom("Starte Moodle-Login");
			$.post("https://moodle2.uni-potsdam.de/login/index.php",
				{
					username: session.get('up.session.username'),
					password: session.get('up.session.password')
				}
			).done(function(response) {
				openInAppBrowser(url);
			}).fail(function() {
				hasOpenInAppBrowser = false;
			});
		} else {
			openInAppBrowser(url);
		}
	}
	
	/**
	 * Opens external links according to the platform we are on. For apps this means using the InAppBrowser, for desktop browsers this means opening a new tab.
	 */
	var overrideExternalLinks = function(e) {
		var $this = $(e.target);
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
			$('.ui-btn-active', app.activePage()).removeClass('ui-btn-active');
			app.route(url);
			e.preventDefault();
			console.log("Opening " + url + " internally");
		} else if(rel == 'norout') {
			e.preventDefault();
		}
	};
	
	/**
	 * Generates a uuid v4. Code is taken from broofas answer in http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	 */
	var uuid4 = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}

	/**
	 * Handles unhandled errors and prevents them from bubbling to the top
	 */
	var onError = function(errorMessage, errorUrl, lineNumber, columnNumber, error) {
		var uuid = localStorage.getItem("user-uuid");
		if (!uuid) {
			uuid = uuid4();
			localStorage.setItem("user-uuid", uuid);
		}

		var info = new Backbone.Model;
		info.url = "https://api.uni-potsdam.de/endpoints/errorAPI/rest/log";
		info.set("uuid", uuid);
		info.set("message", errorMessage);
		info.set("url", errorUrl);
		info.set("line", lineNumber);
		info.set("column", columnNumber);

		console.log("Unhandled error thrown:");
		console.log(info.attributes);

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

	var defaultTransition = function() {
		var device = window.device || {data: 'none'};
		if (device.platform === "ios" || device.platform === "iOS") {
			$.mobile.changePage.defaults.transition = "fade";
		} else {
			$.mobile.changePage.defaults.transition =  "slidefade";
		}

		return $.mobile.changePage.defaults.transition;
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
			detectUA:detectUA,
			onError: onError,
			LocalStore: LocalStore,
			GesturesView: GesturesView,
			activateExtendedAjaxLogging: activateExtendedAjaxLogging,
			cacheDefaults: cacheDefaults,
			defaultTransition: defaultTransition,
			FullySyncedAdapter: FullySyncedAdapter
		};
});