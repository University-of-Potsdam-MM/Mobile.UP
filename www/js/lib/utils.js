define(['jquery', 'underscore', 'backbone', 'app'], function($, _, Backbone, app){

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
	    return rendertmpl.tmpl_cache[tmpl_name];
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
			$("#" + uniqueDivId).append("<div class=\"up-loadingSpinner\"> \
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
	 		this.error = attributes.error;
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
			$(this.el).html(this.template({model: this.model}));
			$(this.el).trigger("create");
			return this;
		}
	});

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
		$.os.ios7 = userAgent.match(/(iPhone\sOS)\s([7_]+)/) ? true : false;
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
	}

	/**
	 * Loading View, that listens to a given model or collection.
	 * As long as the model is loading data from the server, a loading spinner is shown on the given element.
	 */
	var LoadingView = Backbone.View.extend({

		initialize: function() {
			var subject = this.findSubject();
			if (subject){
				this.listenTo(subject, "request", this.spinnerOn);
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
			this.$el.append("<div class=\"up-loadingSpinner\" style=\"margin: 50px;\">" +
								"<img src=\"img/loadingspinner.gif\"></img>" +
							"</div>");
		},

		spinnerOff: function() {
			this.$el.empty();
		}
	});

	/**
	 * Opens external links (identified by rel="external") according to the platform we are on. For apps this means using the InAppBrowser, for desktop browsers this means opening a new tab.
	 */
	var overrideExternalLinks = function(event) {
		var url = $(event.currentTarget).attr("href");
		if (window.cordova) {
			console.log("Opening " + url + " externally");
			window.open(url, "_blank", "enableViewportScale=yes");
			return false;
		} else {
			console.log("Opening " + url + " internally");
		}
	};

	return {
			rendertmpl: rendertmpl,
			removeTabs: removeTabs,
			addLoadingSpinner: addLoadingSpinner,
			removeLoadingSpinner: removeLoadingSpinner,
			getAuthHeader: getAuthHeader,
			ErrorView: ErrorView,
			LoadingView: LoadingView,
			overrideExternalLinks: overrideExternalLinks,
			detectUA:detectUA
		};
});