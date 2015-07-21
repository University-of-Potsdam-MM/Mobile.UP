/**
 *  file contains the initialization of the application
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'router',
	'underscore.string',
	'utils',
	'fastclick',
	'history',
	'jquerymobile'], function($, _, Backbone, Router, _str, utils, FastClick, customHistory){


		var Application = Backbone.Model.extend({

			initialize: function(){
				// initialize fastclick
				new FastClick(document.body);

				$(document).ready(function() {
  					document.addEventListener("deviceready", onDeviceReady, false);
				});

				/**
				 *	functions get exectuted when device is ready and handles hiding of splashscreen and backButton navigation
				 */
				function onDeviceReady() {
    				// hide splashscreen
    				navigator.splashscreen.hide();
    				// EventListener for BackButton
    				document.addEventListener("backbutton", function(e){
    					if(customHistory.length() == 1){
    						e.preventDefault();
    						navigator.app.exitApp();
    					}else{
    						$.mobile.changePage.defaults.transition = utils.defaultTransition();
    						$.mobile.changePage.defaults.reverse = 'reverse';
    						customHistory.goBack();
    					}
    				}, false);
				}

				/**
		 	 	 * Override Backbone.sync to automatically include auth headers according to the url in use
		 	 	 */
				function overrideBackboneSync() {
					var authUrls = ["https://api.uni-potsdam.de/endpoints/roomsAPI",
									"https://api.uni-potsdam.de/endpoints/libraryAPI",
									"https://api.uni-potsdam.de/endpoints/pulsAPI",
									"https://api.uni-potsdam.de/endpoints/moodleAPI",
									"https://api.uni-potsdam.de/endpoints/transportAPI/1.0/",
									"https://api.uni-potsdam.de/endpoints/errorAPI",
									"https://api.uni-potsdam.de/endpoints/personAPI",
									"https://api.uni-potsdam.de/endpoints/mensaAPI",
									"https://api.uni-potsdam.de/endpoints/staticContent"];
					var isStartOf = function(url) {
						return function(authUrl) {
							return _str.startsWith(url, authUrl);
						};
					};

					var sync = Backbone.sync;
					Backbone.sync = function(method, model, options) {
						var url = options.url || _.result(model, "url");
						if (url && _.any(authUrls, isStartOf(url))) {
							options.headers = _.extend(options.headers || {}, { "Authorization": utils.getAuthHeader() });
						}
						return sync(method, model, options);
					};
				}

			 	// Initialize Backbone override
				$(overrideBackboneSync);

				// Initialize external link override
				$(document).on("click", "a", utils.overrideExternalLinks);

				// Activate extended ajax error logging on console
				//utils.activateExtendedAjaxLogging();

				// Register global error handler
				window.onerror = utils.onError;

				Router.initialize();
			}
		});

		return new Application();
});
