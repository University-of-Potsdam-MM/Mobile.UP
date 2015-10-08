var app = {models:{},views:{},controllers:{}};

var prepareViewForDomDisplay = function (page, c, a, $, utils) {
// prepare new view for DOM display
	page.render();
	console.log(utils.capitalize(c) + utils.capitalize(a));

	var d = {};
	var response = {};

	var pageContent = page.$el.attr("data-role", "page");
	var pageTitle = pageContent.find('meta[name="title"]').attr('content');

	var header = utils.renderheader({title: pageTitle});

	pageContent.css('padding-top', '54px');
	$pageContainer = $('#pagecontainer');
	var $header = $pageContainer.find('.ui-header');
	$pageContainer.append(pageContent);
	$pageContainer.trigger("create");
	if ($header.length > 0) {
		$header.replaceWith(header);
	} else {
		$pageContainer.append(header);
	}
	var transition = $.mobile.changePage.defaults.transition;
	var reverse = $.mobile.changePage.defaults.reverse;

	var transition = $.mobile.defaultPageTransition;
	// Erste Seite nicht sliden
	if (this.firstPage) {
		transition = 'none';
		this.firstPage = false;
	}
	return {
		d: d,
		response: response,
		pageContent: pageContent,
		pageTitle: pageTitle,
		reverse: reverse,
		transition: transition
	};
};
var saveScrollPositionExtract = function (customHistory, $) {
	console.log(customHistory);
	if (customHistory.hasHistory()) {
		var name = customHistory.currentRoute();
		this.routesToScrollPositions[name] = $(window).scrollTop();
	}
};
var prepareScrollPositionExtract = function (route, $) {
	var pos = 0;
	//alert(route);
	if (this.routesToScrollPositions[route]) {
		pos = this.routesToScrollPositions[route];
		delete this.routesToScrollPositions[route]
	}

	// We only have one active page because jQuery mobiles custom history is disabled
	var activePage = $.mobile.navigate.history.getActive();
	activePage.lastScroll = pos;
};
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
	'appCache',
	'viewContainer',
	'jquerymobile',
	'datebox',
	'LocalStore'
	], function($, _, Backbone, BackboneMVC, _str, utils, Q, FastClick, Session, customHistory, AppCache, ViewContainer){
		//AppRouter-Klasse erstellen
		var AppRouter = BackboneMVC.Router.extend({
			before:function(route){ //wird komischerweise nur ausgeführt, wenn zurücknavigiert wird. Und genau dafür wird diese Funktion benutzt.
				window.backDetected = true;
			}
		});


		app = {
			c: {}, //Controller-Objekte werden in diesem Array abgelegt
			controllers: {}, //Controllerklassen
			controllerList: [ 
				"controllers/main",
				"controllers/events", 
				"controllers/news", 
				"controllers/campus", //"Onepager" in einem Controller um platz zu sparen
				"controllers/studies", //"Onepager" in einem Controller um platz zu sparen
			], //In der app vorhandene Controller
			viewType:"text/x-underscore-template", //Templateenginekennung (Underscore)
			jsonUrl: 'http://headkino.de/potsdamevents/json/', //Base-Url, die auf dem Server angefragt wird
			going : {}, //Liste aller Event-IDs zu denen der Benutzer geht
			routesToScrollPositions: {},
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
			viewFileExt: 'js', //Dateiendung der View files
			router : new AppRouter(), //Router zuweisen
			appCache : new AppCache(),
			/*
			* Intitialisierung
			*/
			initialize: function(){
				app.session = new Session;
				utils.detectUA($, navigator.userAgent);
				ViewContainer.setIosHeaderFix($);
					/**
				 * Override Backbone.sync to automatically include auth headers according to the url in use
				 */
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
							ViewContainer.setReverseSlidefadeTransition($);
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
				$(document).on("click", "a", utils.overrideExternalLinks);

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
				this.loadControllers(this.controllerList); //Alle Controller laden
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
				var pageName = utils.capitalize(c) + 'Page';
				console.log(app.views[pageName]);
				if (!app.views[pageName]) {
					app.views[pageName] = Backbone.View.extend({
						render: function () {
							this.$el.html('');
							return this;
						}
					});
				}
				console.log(pageName);
				var page = new app.views[pageName](params);
				console.log(page);
				var allowed = app.checkAuth(c) && app.checkAuth(a);
				if (!allowed) {
					q.resolve();
					return {
						done: function (d) {
						}
					};
				}

				var __ret = prepareViewForDomDisplay.call(this, page, c, a, $, utils);
				var d = __ret.d;
				var response = __ret.response;
				var pageContent = __ret.pageContent;
				var pageTitle = __ret.pageTitle;
				var reverse = __ret.reverse;
				var transition = __ret.transition;

				var content = false;
				if (!app.data[c])
					app.data[c] = {};

				/**
				 * Success function, die nachdem Daten vom Server oder aus dem Cache geholt wurden, oder wenn nichts zu holen ist, ausgeführt wird.
				 * @param s state object (After request with model.fetch or collection.fetch or custom: 'cached' or 'set' to indicate whether it was fetched from cache or from a collection)
				 * @param d data object
				 */
				var success = function (s, d) {
					if (content) {
						console.log('content');
						if (content.fetchSuccess)
							content.fetchSuccess(s, d);
						content.p = params;
						if (content.beforeRender)
							content.beforeRender();
						if (s == 'set') { //Model aus collection geholt
							if (content.model) {
								content.model.set(d);
								content.model.p = params;
							}
						} else if (s == 'cached') { //Daten aus dem Cache geholt
							if (content.model) {
								content.model.set(content.model.parse(d));
								content.model.p = params;
							}
							if (content.collection) {
								content.collection.set(content.collection.parse(d));
								content.collection.p = params;
							}
						} else { //Daten vom Server geholt
							if (content.collection) {
								response = d = content.collection.toJSON();
								content.collection.p = params;
								if (content.collection.response)
									response = content.collection.response;
							}

							if (content.model && content.model.toJSON) {
								response = d = content.model.toJSON();
								content.model.p = params;
								if (content.model.response)
									response = content.model.response;
							}
						}
						if (_.keys(response).length > 0) {
							if (!app.data[c])
								app.data[c] = {};
							app.data[c][a] = response; //Daten speichern
							if (content.model)
								app.appCache.setCache(content.model.url, response);
							else if (content.collection) {
								app.appCache.setCache(content.collection.url, response);
							}
						}
						ViewContainer.finishRendering(content, pageTitle, pageContent, $pageContainer, utils, $);
					}
					if (_.keys(response).length > 0)
						q.resolve(response, content);
					else
						q.resolve(d, content);
				};

				/**
				 * Wird nach Pagetransition ausgeführt
				 */
				var afterTransition = function () {
					if (app.views[utils.capitalize(c) + utils.capitalize(a)]) { //Wenn eine View-Klasse für Content vorhanden ist: ausführen
						content = ViewContainer.setCurrentView(params, page, content, c, a, app, utils);
						if ((content.model || content.collection) && content.inCollection) { //Element aus der geladenen Collection holen und nicht vom Server
							var parts = content.inCollection.split('.');
							try {
								var list = eval('app.data.' + content.inCollection);
							} catch (e) {
							}
							if (list) {
								try {
									var filteredList = _.filter(list, function (item) {
										return _.some(item, function (item) {
											return eval('item.' + content.idInCollection) == params.id;
										});
									});
								} catch (e) {
								}
							}
							if (filteredList) //Element in Liste gefunden
								d = filteredList[0];
						}
						if (content.collection) { //Content hat eine Collection
							if (app.appCache.getCache(content.collection.url)) {
								success('cached', app.appCache.getCache(content.collection.url));
							} else if (content.collection.url && (!content.model || typeof content.model.url != 'function')) { //Collection abrufbar von URL
								content.collection.fetch({
									success: success,
									error: function () {
									},
									dataType: 'json'
								});
							} else {
								success();
							}
						} else {
							if (content.model) { //Content hat ein Model
								console.log('Model');
								if (_.keys(d).length > 0) { //Model bereits in Collection gefunden
									success('set', d);
								}
								else if (app.appCache.getCache(content.model.url)) { //Model in cache
									success('cached', app.appCache.getCache(content.model.url));
								} else if (content.model.url && typeof content.model.url != 'function') { //Model abrufbar von URL
									console.log(content.model);
									content.model.fetch($.extend(utils.cacheDefaults(), {
										success: success,
										error: function () {
										},
										dataType: 'json'
									}));
								} else {
									success();
								}
							} else { //Content einfach so
								success();
							}
						}
					} else { //Wenn keine Viewklasse vorhanden ist, die page als view nehmen
						ViewContainer.usePageAsView(page, app);
						success();
					}
				};
				ViewContainer.saveAndPrepareScrollPosition(app, Backbone);
				customHistory.push(Backbone.history.fragment);
				ViewContainer.executeTransition(pageContent, transition, reverse, page, afterTransition, app, Q, $);

				return q.promise;
			},
			
			updateHeader: function($el){
				ViewContainer.updateHeaderExtract($el, $, utils);
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
			
			saveScrollPosition: function() {
				saveScrollPositionExtract.call(this, customHistory, $);
			},
	
			prepareScrollPositionFor: function(route) {
				prepareScrollPositionExtract.call(this, route, $);
			},
			
			/**
			* Daten vom Server laden
			* @param url zu ladende URL
			*/
			get: function(url){
				var q = Q.defer();
				if(!this.refreshing && app.appCache.hasValidRequestEntry(url)) { //Alle 5 Stunden wird aktualisiert, sonst aus dem Cache holen, wenn vorhanden
					q.resolve(app.appCache.getRequest(url));
				} else {
					$.getJSON(this.jsonUrl + url).done(function(d){ app.appCache.setRequest(url); q.resolve(d);}); //Url anfragen
				}
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
						  ViewContainer.notifyMissingServerConnection(app, $);
					  }
				});
				$(document).on('pagebeforechange', function(e, a){ //Bevor zur nächsten Seite gewechselt wird
					ViewContainer.animateHeaderAndFooter(a, $);
				});
				
				$(document).on('click', 'a[data-rel="back"]', function(){ //Backbutton clicks auf zurücknavigieren mappen
					window.history.back();
				});
			},
			/*
			* Momentan aktive Seite zurückgeben
			*/
			activePage: function(){
				return ViewContainer.activePageExtract($);
			},
			/*
			* InhaltsContainer der momentan aktiven Seite zurückgeben
			*/
			activeCon:function(){
				return ViewContainer.activeConExtract.call(this, $);
			},
			/*
			* Alle Controllers und deren Viewtemplates laden
			* @urls: Liste der URLs zu den Controller Dateien
			*/
			loadControllers: function(urls) {
				var that = this;
				require(urls, function(){
					var views = [], modules = [], classNames = [], viewNames = [], appc = [];
					var c = 0, d = 0;
					for(var i in app.controllers) {
						that.controllersLoaded = true;
						app.c[i] = appc[i] = (new app.controllers[i]);
						console.log(app.c[i]);
						if(app.c[i].init) {
							console.log(app.c[i].init);
							app.c[i].init();
						}
						for(var j in appc[i].views) {
							views[c] = 'text!'+appc[i].views[j]+'.' + that.viewFileExt;
							viewNames[c] = appc[i].views[j];
							c++;
						}
						if(appc[i].modules) 
						for(var name in appc[i].modules) {
							modules[d] = 'js/modules/'+name+'.' + that.viewFileExt;
							//alert(modules[d]);
							//classNames[d] = appc[i].modules[name]; //deprectaed
							
							d++;
						}
					}
					require(modules, function(){
						$(document).trigger('app:controllersLoaded');
					});
				});
			}
		};

		return app;
});
