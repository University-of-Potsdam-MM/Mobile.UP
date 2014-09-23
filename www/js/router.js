/*
 *	Router
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'BaseRouter',
	'Session',
	'utils',
	'modules/home',
	'modules/news',
	'modules/events',
	'modules/study',
	'modules/moodle',
	'modules/emergency',
	'modules/campus',
	'modules/sitemap',
	'modules/room',
	'modules/opening',
	'modules/transport',
	'modules/transport2',
	'modules/mensa',
	'modules/library',
	'modules/lectures',
	'modules/grades',
	'modules/impressum',
	'modules/options'
], function($, _, Backbone, BaseRouter, Session, utils, HomePageView, NewsView, EventsView, StudyPageView, MoodlePageView, EmergencyPageView, CampusPageView, SitemapPageView, RoomPageView, OpeningPageView, TransportPageView, Transport2PageView, MensaPageView, LibraryPageView, LecturesPageView, GradesPageView, ImpressumPageView, OptionsPageView){

	var AppRouter = BaseRouter.extend({

		routes:{
			// Routes for Index - Page
			"": "home",
			"home": "home",
			"news/*id": "news",
			"news": "news",
			"events": "events",
			"events/*id": "events",
			"study": "study",
			"study/moodle": "moodle",
			"campus": "campus",
			"library": "library",
			// Routes for Campus - Page
			"sitemap": "sitemap",
			"room": "room",
			"transport": "transport",
			"transport2": "transport2",
			"opening": "opening",
			"mensa": "mensa",
			"emergency": "emergency",
			"lectures":"lectures",
			"lectures/*vvzUrls":"lectures",
			"grades":"grades",
			"impressum": "impressum",
			"options": "options"
		},

		// routes that need authentication
		requiresAuth: ['moodle', 'grades'],

		// routes to prevent authentication when already authenticated
		preventAccessWhenAuth: [],

		before: function(params, next, name){
			//Checking if user is authenticated or not
			//then check the path if the path requires authentication

			var isAuth = this.session.get('up.session.authenticated');
			var path = Backbone.history.location.hash;
			var needAuth = _.contains(this.requiresAuth, name);
			var cancelAccess = _.contains(this.preventAccessWhenAuth, name);

			if(needAuth && !isAuth){
				// If user gets redirect to login because wanted to access
				// to a route that requires login, save the path in session
				// to redirect the user back to path after successful login
				this.session.set('up.session.redirectFrom', path);
				Backbone.history.navigate('options', { trigger : true });
			}else if(isAuth && cancelAccess){
				// User is authenticated and tries to go to login, register ...
				// so redirect the user to home page
				Backbone.history.navigate('', { trigger : true });
			}else{
				//No problem, handle the route!!
				return next();
			}
		},

		after: function(){
		},

		initialize: function(){
			this.session = new Session;
		},

		home: function(){
			this.changePage(new HomePageView);
		},

		news: function(id){
			var page = new NewsView.NewsPage;
			this.changePage(page);
			var hideSettings = false;
			if(!id || id == 'index'){
				new NewsView.NewsIndex({page:page});
			} else {
				hideSettings = true;
				if(id.indexOf('set_sources') > -1)
					new NewsView.NewsSet_sources({page:page});
				else if(id.indexOf('source') > -1)
					new NewsView.NewsSource({page:page, id:id.split('/')[1]});
				else if(id.indexOf('view') > -1)
					new NewsView.NewsView({page:page, id:id.split('/')[1]});
			}
			if(hideSettings)
				$('.settings').hide();
		},

		events: function(id){
			var page = new EventsView.EventsPage;
			//console.log(page);
			var hideFooter = false;
			if(!id || id.indexOf('index') > -1){
				var filter = id ? (id.split('/')[1] ? id.split('/')[1] : 'next') : 'next'
				new EventsView.EventsIndex({page:page, filter: filter});
			} else {
				hideFooter = true;
				if(id.indexOf('set_locations') > -1)
					new EventsView.EventsSet_locations({page:page, id:2});
				else
				if(id.indexOf('place') > -1)
					new EventsView.EventsPlace({page:page, id:id.split('/')[1]});
				else
				if(id.indexOf('view') > -1)
					new EventsView.EventsView({page:page, id:id.split('/')[1]});
			}
			this.changePage(page);
			if(hideFooter) {
				$('.footer,.settings').hide();
			}
		},

		study: function(){
			this.changePage(new StudyPageView);
		},

		moodle: function () {
			this.changePage(new MoodlePageView({model: this.session}));
		},

		campus: function(){
			this.changePage(new CampusPageView);
		},

		lectures: function(vvzUrls){
			this.changePage(new LecturesPageView);

			var vvzHistory = this.currentView.vvzHistory;
			if (vvzUrls != undefined) {
				vvzHistory.reset(JSON.parse(vvzUrls));
			} else {
				vvzHistory.reset();
			}

			this.listenTo(this.currentView, "openVvzUrl", function(vvzHistory) {
				var param = JSON.stringify(vvzHistory.toJSON());
				this.navigate("lectures/" + encodeURIComponent(param));
			});
		},

		grades: function(){
			this.changePage(new GradesPageView);
		},

		library: function(){
			// later on Search View and PersonPageView and LibraryPageView
			this.changePage(new LibraryPageView);
		},

		// Routes for Campus - Page
		sitemap: function(){
			this.changePage(new SitemapPageView);
		},

		room: function(){
			this.changePage(new RoomPageView);
		},

		transport: function(){
			this.changePage(new TransportPageView);
		},

		transport2: function(){
			this.changePage(new Transport2PageView);
		},

		opening: function(){
			this.changePage(new OpeningPageView);
		},

		transport: function(){
			this.changePage(new TransportPageView);
		},

		mensa: function(){
			this.changePage(new MensaPageView);
		},

		emergency: function(){
			this.changePage(new EmergencyPageView);
		},

		impressum: function(){
			this.changePage(new ImpressumPageView);
		},

		options: function(){

			this.changePage(new OptionsPageView({model: this.session}));
		},

		changePage: function(page){
			if (this.currentView) {
				// Stop listening to events
				this.currentView.stopListening();
			}

			// prepare new view for DOM display
			$(page.el).attr('data-role', 'page');
			page.render();
			// prepare for transition
			$('body').css('overflow', 'hidden');
			$('#pagecontainer').append($(page.el));

			var transition = $.mobile.changePage.defaults.transition;
			var reverse = $.mobile.changePage.defaults.reverse;

			// Erste Seite nicht sliden
			if (this.firstPage){
				transition = 'none';
				this.firstPage = false;
			}

			$.mobile.changePage($(page.el), {changeHash: false, transition: transition, reverse: reverse});

			if(!this.currentView){
				$('#pagecontainer').children().first().remove();
				$('body').css('overflow', 'auto');
				$("body").fadeIn(100);
			}

			this.currentView = page;
		}
	});

	var initialize= function(){
		utils.detectUA($, navigator.userAgent);
		var approuter = new AppRouter;
		Backbone.history.start();
	};

	return {
		initialize: initialize
	};
});