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
	'modules/calendar',
	'modules/moodle',
	'modules/emergency',
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
	'modules/options',
	'modules/people'
], function($, _, Backbone, BaseRouter, Session, utils, HomePageView, NewsView, EventsView, CalendarPageView, MoodlePageView, EmergencyPageView, SitemapPageView, RoomPageView, OpeningPageView, TransportPageView, Transport2PageView, MensaPageView, LibraryPageView, LecturesPageView, GradesPageView, ImpressumPageView, OptionsPageView, PeoplePageView){

	var AppRouter = BaseRouter.extend({

		routes:{
			// Routes for Index - Page
			"": "home",
			"home": "home",
			"news/*id": "news",
			"news": "news",
			"events": "events",
			"events/*id": "events",
			"calendar": "calendar",
			"calendar/*day": "calendar",
			"study/moodle": "moodle",
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
			"options": "options",
			"people": "people"
		},

		history: [],

		routesToScrollPositions: {},

		// routes that need authentication
		requiresAuth: ['calendar', 'moodle', 'grades', 'people'],

		// routes to prevent authentication when already authenticated
		preventAccessWhenAuth: [],

		initialize: function(){
			this.session = new Session;
			this.listenTo(this, 'route', function(route, params){
				this.history.push({name: route});
			});
		},

		before: function(params, next, name){
			this.saveScrollPosition();
			this.prepareScrollPositionFor(name);

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

		after: function(params, name){
		},

		saveScrollPosition: function() {
			if (this.history.length > 0){
				var name = this.history[this.history.length-1].name;
    			this.routesToScrollPositions[name] = $(window).scrollTop();
    		}
		},

		prepareScrollPositionFor: function(route) {
			var pos = 0;
			if (this.routesToScrollPositions[route]) {
				pos = this.routesToScrollPositions[route];
				delete this.routesToScrollPositions[route]
			}

			// We only have one active page because jQuery mobiles custom history is disabled
			var activePage = $.mobile.navigate.history.getActive();
			activePage.lastScroll = pos;
		},

		home: function(){
			this.changePage(new HomePageView);
		},

		currentPage: function(){
			return this.history[this.history.length-1].name;
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
				var filter = id ? (id.split('/')[1] ? id.split('/')[1] : false) : false;
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

		calendar: function(day){
			this.changePage(new CalendarPageView({day: day}));
		},

		moodle: function () {
			this.changePage(new MoodlePageView({model: this.session}));
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
				var url = "lectures/" + encodeURIComponent(param)
				this.navigate(url);
				this.history.push({name: url});
			});
		},

		grades: function(){
			this.changePage(new GradesPageView);
		},

		library: function(){
			// later on Search View and PersonPageView and LibraryPageView
			this.listenToLibraryChange();
			this.changePage(new LibraryPageView.View);
		},
		
		listenToLibraryChange: _.once(function() {
			this.listenTo(LibraryPageView.Bus, "openView", this.changePage);
		}),

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

		people: function(){
			this.changePage(new PeoplePageView);
		},

		changePage: function(page){
			if (this.currentView) {
				// Stop listening to events
				this.currentView.stopListening();
			}

			// prepare new view for DOM display
			page.render();
			var header = page.$("[data-role=header]").detach().toolbar();
			var pageContent = page.$el.attr("data-role", "page");
			// prepare for transition
			$('body').css('overflow', 'hidden');
			$('#pagecontainer').append(pageContent);

			var transition = $.mobile.changePage.defaults.transition;
			var reverse = $.mobile.changePage.defaults.reverse;

			// dont slide first page
			if (this.firstPage){
				transition = 'none';
				this.firstPage = false;
			}

			// If there already is an old view then insert the new header invisible
			// The headers will be faded after the page transition
			if (this.currentView) {
				header.css("display", "none")
			}

			// As the page carries a ui-page-theme-a class, the header should carry one too
			// If the page carries a home id the header should carry a home-id class
			// This is done for reasons of backward compatibility
			header.addClass("ui-page-theme-a");
			if (pageContent.attr("id") == "home") {
				header.addClass("home-id");
			}

			$('#pagecontainer').append(header);

			var headers = $("[data-role=header]");
            if (headers.length > 1) {
            	// Remember to keep this in sync with the ".in, .out" css rule
            	var fadeTime = 2 * 300;

            	var oldHeader = headers.first();
                var newHeader = headers.last();

                oldHeader.fadeOut("fast", function() { oldHeader.remove(); });
                newHeader.fadeIn("fast");
            }

            $.mobile.changePage(pageContent, {changeHash: false, transition: transition, reverse: reverse});

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
		window.approuter = new AppRouter;
		Backbone.history.start();
	};

	return {
		initialize: initialize
	};
});