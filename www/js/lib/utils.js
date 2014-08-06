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

	return {
			rendertmpl: rendertmpl,
			removeTabs: removeTabs,
			addLoadingSpinner: addLoadingSpinner,
			removeLoadingSpinner: removeLoadingSpinner,
			getAuthHeader: getAuthHeader,
			ErrorView: ErrorView
		};
});