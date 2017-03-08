var app = {models:{},views:{},controllers:{}};
define([
	'jquery',
	'underscore',
	'backbone',
	'backboneMVC',
	'underscore.string',
	'utils',
	'fastclick',
	'Session',
	'history',
	'viewContainer',
	'controllerLoader',
	'jquerymobile',
	'datebox',
	'LocalStore'
	], function($, _, Backbone, BackboneMVC, _str, utils, FastClick, Session, customHistory, ViewHelper, controllerLoader){
		var viewContainer = ViewHelper.viewContainer;
		viewContainer.initialize();
		var pageContainer = ViewHelper.pageContainer;

		//AppRouter-Klasse erstellen
		var AppRouter = BackboneMVC.Router.extend({
			before:function(route){ //wird komischerweise nur ausgeführt, wenn zurücknavigiert wird. Und genau dafür wird diese Funktion benutzt.
				window.backDetected = true;
			}
		});

		_.extend(app, {
			authUrls: [
				"https://api.uni-potsdam.de/endpoints/roomsAPI",
				"https://api.uni-potsdam.de/endpoints/libraryAPI",
				"https://api.uni-potsdam.de/endpoints/pulsAPI",
				"https://api.uni-potsdam.de/endpoints/moodleAPI",
				"https://api.uni-potsdam.de/endpoints/transportAPI/2.0/",
				"https://api.uni-potsdam.de/endpoints/errorAPI",
				"https://api.uni-potsdam.de/endpoints/personAPI",
				"https://api.uni-potsdam.de/endpoints/mensaAPI",
				"https://api.uni-potsdam.de/endpoints/newsAPI",
				"https://api.uni-potsdam.de/endpoints/staticContent"],
			router : new AppRouter(), //Router zuweisen
			viewManager: viewContainer,
			/*
			* Intitialisierung
			*/

			initialize: function(){
				app.session = new Session;
				new FastClick(document.body);

				if (!window.device) {
					utils.detectUA($, navigator.userAgent);
				}

				$(document).ready(function() {
  					document.addEventListener("deviceready", onDeviceReady, false);
				});

				/**
				 *	functions get exectuted when device is ready and handles hiding of splashscreen and backButton navigation
				 */
				function onDeviceReady() {
					utils.detectUA($, navigator.userAgent);
					viewContainer.setIosHeaderFix();

    				// hide splashscreen
    				navigator.splashscreen.hide();
    				// EventListener for BackButton
    				document.addEventListener("backbutton", function(e){
    					if(customHistory.length() == 1){
    						e.preventDefault();
    						navigator.app.exitApp();
    					}else{
							viewContainer.setReverseSlidefadeTransition(true);
							customHistory.goBack();
    					}
    				}, false);
				}

				// Initialize Backbone override
				$(utils.overrideBackboneSync);

				// Initialize external link override
				$(document).on("click", "a", _.partial(utils.overrideExternalLinks, _, viewContainer.removeActiveElementsOnCurrentPage));

				// Register global error handler
				window.onerror = utils.onError;

				//Globale Events zuordnen
				this.bindEvents();
				//Anwendungsurl ermitteln
				var baseUrl = document.location.pathname.replace(/\/index\.html/, '');
				//Backbone URL-Routing-Funktion starten
				customHistory.startTracking(baseUrl);

				this._gotoEntryPoint();
			},

			_gotoEntryPoint: function() {
				if(!window.location.hash) { //Wenn keine URL übergeben wurde, das Hauptmenü aufrufen
					this.route("main/menu");
				} else { //Sonst aktuelle URL in die app.history aufnehmen
					customHistory.push(Backbone.history.fragment);
				}
			},

			/**
			* Wrapper für die Backbone route Funktion
			* @param url: zu routende URL
			* @param noTrigger: true: nur url ändern aber nicht Aktion ausführen
            * @param replace
			*/
			route:function(url, noTrigger, replace){
				var trigger = !noTrigger;
				replace = !!replace;
				url = this._cleanUrl(url);
				this.router.navigate(url, {trigger: trigger, replace: replace}); //Url auf Controller routen
			},
			/**
			 * Removes leading # and ensures the right entry point
			 * @param url Raw url
			 * @returns Cleaned url
			 */
			_cleanUrl: function(url) {
				if(url.charAt(0) == '#')
					url = url.slice(1);
				if(url == 'home' || url == '')
					url = 'main/menu';
				return url;
			},
			/*
			* Zur letzten URL zurückwechseln, die in app.history gespeichert ist
			* @noTrigger: Aktion ausführen: false, sonst true
			*/
			previous: function(noTrigger) {
				viewContainer.setReverseSlidefadeTransition(true);

				if (noTrigger) {
					customHistory.executeBack(_.bind(function(previous) {
						this.route(previous, noTrigger);
					}, this));
				} else {
					customHistory.goBack();
				}

			},
			/*
			* Wenn nötig Daten vom Server laden, Seite rendern und Seitenübergang vollführen
			* @c: Controllername
			* @a: Actionsname
			* @url: anzufragende URL oder Objekt mit Daten für den View
			* @transition: Als String: jQueryMobile-Pagetransitionsname (Standard: slide),
						   Oder als Objekt: Parameter für das Rendern des View
			*/
			loadPage: function(c, a, params, transition) {
				params = params || {};
				var q = $.Deferred();

				var page = viewContainer.prepareViewForDomDisplay(c, params);

				// FIXME Transition parameter is ignored
				var transitionOptions = {
					page: page,
					extras: {
						c: c,
						a: a,
						page: page,
						params: params,
						q: q
					},
					route: {
						from: customHistory.currentRouteInTransition(),
						to: Backbone.history.fragment
					}
				};
				pageContainer.executeTransition(transitionOptions);

				return q.promise();
			},

			/**
			* Globale Events setzen
			*/
			bindEvents:function(){
				var self = this;
				$.ajaxSetup({
					  "error":function() { //Globale AJAX-Fehlerfunktion, wenn z.B. keine Internetverbindung besteht
						  app.locked = false;
						  viewContainer.notifyMissingServerConnection(app);
					  }
				});

				$(document).on('click', 'a[data-rel="back"]', function(){ //Backbutton clicks auf zurücknavigieren mappen
					customHistory.goBack();
				});
			}
		});

		return app;
});