var app = {models:{},views:{},controllers:{}};
define([
	'jquery',
	'underscore',
	'backbone',
	'backboneMVC',
	'underscore-string',
	'utils',
	'q',
	'fastclick',
	'Session',
	'history',
	'viewContainer',
	'contentLoader',
	'controllerLoader',
	'jquerymobile',
	'datebox',
	'LocalStore'
	], function($, _, Backbone, BackboneMVC, _str, utils, Q, FastClick, Session, customHistory, ViewHelper, contentLoader, controllerLoader){
		var viewContainer = ViewHelper.viewContainer;
		viewContainer.initialize();

		//AppRouter-Klasse erstellen
		var AppRouter = BackboneMVC.Router.extend({
			before:function(route){ //wird komischerweise nur ausgeführt, wenn zurücknavigiert wird. Und genau dafür wird diese Funktion benutzt.
				window.backDetected = true;
			}
		});


		app = {
			c: {}, //Controller-Objekte werden in diesem Array abgelegt
			controllers: {}, //Controllerklassen
			history:[],
			views:{},
			models:{},
			data: {},
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
				/**
		 	 	 * Override Backbone.sync to automatically include auth headers according to the url in use
		 	 	 */
				function overrideBackboneSync() {
					var authUrls = app.authUrls;
					var isStartOf = function(url) {
						return function(authUrl) {
							return _.str.startsWith(url, authUrl);
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

				/**
			 	 * Initialize Backbone override
			 	 */
				$(overrideBackboneSync);

				// Initialize external link override
				$(document).on("click", "a", _.partial(utils.overrideExternalLinks, _, viewContainer.removeActiveElementsOnCurrentPage));

				// Register global error handler
				window.onerror = utils.onError;
				
				this.baseUrl = document.location.pathname; 
				this.baseUrl = this.baseUrl.replace(/\/index\.html/, ''); //Anwendungsurl ermitteln
				var that = this;
				$(document).one('app:controllersLoaded', function(){ //Wird ausgeführt wenn alle Controller und Viewtemplates geladen wurden
					that.bindEvents(); //Globale Events zuordnen
					Backbone.history.start({pushState: false, root: that.baseUrl}); //Backbone URL-Routing-Funktion starten
					if(!window.location.hash) { //Wenn keine URL übergeben wurde, das Hauptmenü aufrufen
						that.route("main/menu"); 
					} else { //Sonst aktuelle URL in die app.history aufnehmen
						app.history.push(Backbone.history.fragment); 
					}
				});
				controllerLoader.loadControllersExtract(); //Alle Controller laden
				customHistory.startTracking();
			},
			/**
			* Wrapper für die Backbone route Funktion
			* @param url: zu routende URL
			* @param noTrigger: true: nur url ändern aber nicht Aktion ausführen
			*/
			route:function(url, noTrigger, replace){
				var trigger = !noTrigger;
				replace = !!replace;
				if(trigger) {
					this.history.push(url);
				}
				if(url.charAt(0) == '#')
					url = url.slice(1); 
				if(url == 'home' || url == '')
					url = 'main/menu';
				this.router.navigate(url, {trigger: trigger, replace: replace}); //Url auf Controller routen
			},
			/*
			* Initialisiert den Refresh einer URL vom Server
			*/
			refresh:function(callback){
				var url = Backbone.history.fragment; //Aktuelle URL
				this.refreshing = true; //Globales Refreshing aktivieren
				this.setCallback(callback); //Callback setzten
				this.route(url); //Zu refreshende Url routen
			},
			/*
			* Zur letzten URL zurückwechseln, die in app.history gespeichert ist 
			* @noTrigger: Aktion ausführen: false, sonst true
			*/
			previous: function(noTrigger){
				if(this.history[this.history.length - 2]) {
					this.history.pop();
					this.route(this.history[this.history.length - 1], noTrigger);
				}
			},
			callback : function(){},
			/*
			* Globale Callback-Funktion setzen, die nach Request ausgeführt wird
			* @callback: Zu setzende Callback-Funktion
			*/
			setCallback:function(callback){
				var self = this;
				this.callback = function(){
					callback(arguments);
					self.callback = function(){};
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
				var q = Q.defer();

				if (!params)
					params = {};

				var page = viewContainer.getPage(c, app.views, params);

				// Check if access to the page is allowed
				var allowed = app.checkAuth(c) && app.checkAuth(a);
				if (!allowed) {
					q.resolve();
					return {
						done: function (d) { }
					};
				}

				// FIXME Transition parameter is ignored
				var transitionOptions = viewContainer.prepareViewForDomDisplay(page);
				
				var success = function(content) {
					/**
					 * Success function, die nachdem Daten vom Server oder aus dem Cache geholt wurden, oder wenn nichts zu holen ist, ausgeführt wird.
					 * @param s state object (After request with model.fetch or collection.fetch or custom: 'cached' or 'set' to indicate whether it was fetched from cache or from a collection)
					 * @param d data object
					 */
					return function (s, d) {
						if (content) {
							d = contentLoader.setFetchedContent(content, s, d, params, c, a);
							viewContainer.finishRendering(content, transitionOptions.page, $pageContainer);
						}
						q.resolve(d, content);
					}
				};

				// afterTransition is called first, success is called afterwards
				/**
				 * Wird nach Pagetransition ausgeführt
				 */
				transitionOptions.afterTransition = function () {
					contentLoader.initData(c);

					params.page = page.$el;
					var content = viewContainer.createViewForName(c, a, page, params);
					contentLoader.retreiveOrFetchContent(content, {}, params, success(content));
				};

				viewContainer.saveAndPrepareScrollPosition();
				customHistory.push(Backbone.history.fragment);
				viewContainer.executeTransition(app, transitionOptions);

				return q.promise;
			},
			
			checkAuth: function(name){
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
				$(document).on('pagebeforechange', function(e, a){ //Bevor zur nächsten Seite gewechselt wird
					viewContainer.animateHeaderAndFooter(a);
				});
				
				$(document).on('click', 'a[data-rel="back"]', function(){ //Backbutton clicks auf zurücknavigieren mappen
					window.history.back();
				});
			}
		};

		return app;
});
