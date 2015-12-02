var app = {models:{},views:{},controllers:{}};
define([
	'jquery',
	'underscore',
	'backbone',
	'backboneMVC',
	'underscore.string',
	'utils',
	'q',
	'fastclick',
	'Session',
	'history',
	'viewContainer',
	'controllerLoader',
	'jquerymobile',
	'datebox',
	'LocalStore'
	], function($, _, Backbone, BackboneMVC, _str, utils, Q, FastClick, Session, customHistory, ViewHelper, controllerLoader){
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
			c: {}, //Controller-Objekte werden in diesem Array abgelegt
			requiresAuth: ['calendar', 'moodle', 'grades', 'people'],// routes that need authentication
			preventAccessWhenAuth: [],// routes to prevent authentication when already authenticated
			authUrls: [
				"https://api.uni-potsdam.de/endpoints/roomsAPI",
				"https://api.uni-potsdam.de/endpoints/libraryAPI",
				"https://api.uni-potsdam.de/endpoints/pulsAPI",
				"https://api.uni-potsdam.de/endpoints/moodleAPI",
				"https://api.uni-potsdam.de/endpoints/transportAPI/1.0/",
				"https://api.uni-potsdam.de/endpoints/errorAPI",
				"https://api.uni-potsdam.de/endpoints/personAPI",
				"https://api.uni-potsdam.de/endpoints/mensaAPI",
				"https://api.uni-potsdam.de/endpoints/staticContent"],
			router : new AppRouter(), //Router zuweisen
			viewManager: viewContainer,
			/*
			* Intitialisierung
			*/
			initialize: function(){
				app.session = new Session;
				utils.detectUA($, navigator.userAgent);
				viewContainer.setIosHeaderFix();
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
							viewContainer.setReverseSlidefadeTransition();
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

				customHistory.startTracking();

				//Globale Events zuordnen
				this.bindEvents();
				//Anwendungsurl ermitteln
				var baseUrl = document.location.pathname.replace(/\/index\.html/, '');
				//Backbone URL-Routing-Funktion starten
				customHistory.startSecond(baseUrl);

				this.gotoEntryPoint();
			},

			gotoEntryPoint: function() {
				if(!window.location.hash) { //Wenn keine URL übergeben wurde, das Hauptmenü aufrufen
					this.route("main/menu");
				} else { //Sonst aktuelle URL in die app.history aufnehmen
					customHistory.pushSecondHistory(Backbone.history.fragment);
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
				if(trigger) {
					customHistory.pushSecondHistory(url);
				}
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
			* Initialisiert den Refresh einer URL vom Server
			*/
			refresh:function(callback){
				var url = Backbone.history.fragment; //Aktuelle URL
				this.refreshing = true; //Globales Refreshing aktivieren
				this._setCallback(callback); //Callback setzten
				this.route(url); //Zu refreshende Url routen
			},
			/*
			* Zur letzten URL zurückwechseln, die in app.history gespeichert ist 
			* @noTrigger: Aktion ausführen: false, sonst true
			*/
			previous: function(noTrigger){
                customHistory.executeBack(_.bind(function(previous) {
                    this.route(previous, noTrigger);
                }, this));
			},
			callback : function(){},
			/*
			* Globale Callback-Funktion setzen, die nach Request ausgeführt wird
			* @callback: Zu setzende Callback-Funktion
			*/
			_setCallback:function(callback){
				var self = this;
				this.callback = function(){
					callback(arguments);
					self.callback = function(){};
				}
			},

			/**
			 *
			 * @param c Controllername
			 * @param a Actionsname
			 * @returns true is access is allowed, false otherwise
			 */
			isAllowed: function(c, a) {
				var checkAuth = function(name){
					var isAuth = app.session.get('up.session.authenticated');
					var path = Backbone.history.location.hash;
					var needAuth = _.contains(app.requiresAuth, name);
					var cancelAccess = _.contains(app.preventAccessWhenAuth, name);
					if(needAuth && !isAuth){
						// If user gets redirect to login because wanted to access
						// to a route that requires login, save the path in session
						// to redirect the user back to path after successful login
						app.session.set('up.session.redirectFrom', path);
						Backbone.history.navigate('main/options', { trigger : true });
						return false;
					}else if(isAuth && cancelAccess){
						// User is authenticated and tries to go to login, register ...
						// so redirect the user to home page
						Backbone.history.navigate('', { trigger : true });
						return false;
					}else{
						//No problem, handle the route!!
						return true;
					}
				};

				return checkAuth(c) && checkAuth(a);
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
				var q = Q.defer();

				// Check if access to the page is allowed
				if (!app.isAllowed(c, a)) {
					q.resolve();
					return {
						done: function (d) { }
					};
				}

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
						from: customHistory.currentRoute(),
						to: Backbone.history.fragment
					}
				};
				pageContainer.executeTransition(transitionOptions);

				return q.promise;
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
					window.history.back();
				});
			}
		});

		return app;
});
