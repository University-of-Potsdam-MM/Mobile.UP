/*
 *	Router
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'BaseRouter',
	'Session',
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
], function($, _, Backbone, BaseRouter, Session, HomePageView, NewsPageView, EventsPageView, StudyPageView, MoodlePageView, EmergencyPageView, CampusPageView, SitemapPageView, RoomPageView, OpeningPageView, TransportPageView, Transport2PageView, MensaPageView, LibraryPageView, LecturesPageView, GradesPageView, ImpressumPageView, OptionsPageView){

	var AppRouter = BaseRouter.extend({

		routes:{
			// Routes for Index - Page
			"": "home",
			"nav-panel": "navpanel",
			"home": "home",
			"news": "news",
			"events": "events",
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
		requiresAuth: ['moodle'],

		// routes to prevent authentication when already authenticated
		preventAccessWhenAuth: [],

		before: function(params, next, name){
			//Checking if user is authenticated or not
			//then check the path if the path requires authentication

			var isAuth = this.session.get('authenticated');
			console.log('isAuth?', isAuth);
			var path = Backbone.history.location.hash;
			var needAuth = _.contains(this.requiresAuth, name);
			var cancelAccess = _.contains(this.preventAccessWhenAuth, name);

			console.log('Path', path, 'NeedAuth?', needAuth, 'cancelAccess?', cancelAccess);

			if(needAuth && !isAuth){
				// If user gets redirect to login because wanted to access
				// to a route that requires login, save the path in session
				// to redirect the user back to path after successful login
				this.session.set('redirectFrom', path);
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
			// still empty
		},

		initialize: function(){
			this.session = new Session;

			/*
			// Handle back button throughout the application
        	$('.back').live('click', function(event) {
            	window.history.back();
            	return false;
        	});
        	this.firstPage = true;
        	*/

		},

		home: function(){
			console.log("Side -> Home");
			this.changePage(new HomePageView);
		},

		navpanel: function(){
			console.log("Nav-Panel");
			$('#nav-panel').trigger("create");
			$('#nav-panel').trigger("updatelayout");
			$('#nav-panel').panel({animate: true});
			$('#nav-panel').panel("open");
			//$('#nav-panel').popup();
			//$('#nav-panel').popup("open");
			//$('#nav-panel').html($(this.currentView.el)).popup("open");
		},

		news: function(){
			console.log("Side -> News");
			this.changePage(new NewsPageView);
		},

		events: function(){
			console.log("Side -> Events");
			this.changePage(new EventsPageView);
		},

		study: function(){
			console.log("Side -> Study");
			this.changePage(new StudyPageView);
		},

		moodle: function () {
			console.log("Side -> Study -> Moodle");
			this.changePage(new MoodlePageView({model: this.session}));
		},

		campus: function(){
			console.log("Side -> Campus");
			this.changePage(new CampusPageView);
		},

		lectures: function(vvzUrls){
			console.log("Side -> Lectures");
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
			console.log("Side -> Grades");
			this.changePage(new GradesPageView);
		},

		library: function(){
			console.log("Side -> Library");
			// later on Search View and PersonPageView and LibraryPageView
			this.changePage(new LibraryPageView);
		},

		// Routes for Campus - Page
		sitemap: function(){
			console.log("Side -> Sitemaps");
			this.changePage(new SitemapPageView);
		},

		room: function(){
			console.log("Side -> Rooms");
			this.changePage(new RoomPageView);
		},

		transport: function(){
			this.changePage(new TransportPageView);
		},

		transport2: function(){
			console.log("Side -> Transport2");
			this.changePage(new Transport2PageView);
		},

		opening: function(){
			console.log("Side -> Openings");
			this.changePage(new OpeningPageView);
		},

		transport: function(){
			console.log("Side -> Transport");
			this.changePage(new TransportPageView);
		},

		mensa: function(){
			console.log("Side -> Mensa");
			this.changePage(new MensaPageView);
		},

		emergency: function(){
			console.log("Side -> Emergency");
			this.changePage(new EmergencyPageView);
		},

		impressum: function(){
			console.log("Side -> Impressum");
			this.changePage(new ImpressumPageView);
		},

		options: function(){
			console.log("Side -> Options");
			this.changePage(new OptionsPageView({model: this.session}));
		},

		changePage: function(page){

			// prepare new view for DOM display
			$(page.el).attr('data-role', 'page');
			page.render();
			// prepare for transition
			$('body').css('overflow', 'hidden');
			$('#nav-panel').css('display', 'none');

			$('#pagecontainer').append($(page.el));

			var transition = $.mobile.defaultPageTransition;

			// Erste Seite nicht sliden
			if (this.firstPage){
				transition = 'none';
				this.firstPage = false;
			}

			if (page.$el[0].id == 'transport' || page.$el[0].id == 'transport2') {
				transition = 'none';
			}

			$.mobile.changePage($(page.el), {changeHash: false, transition: transition});

			if(!this.currentView){
				$('#pagecontainer').children().first().remove();
				$('body').css('overflow', 'auto');
				$("body").fadeIn(100);
			}

			this.currentView = page;
		}
	});

	var initialize= function(){
		var approuter = new AppRouter;
		Backbone.history.start();
	};

	return {
		initialize: initialize
	};
});