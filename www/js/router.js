/*
 *	Router
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'modules/home',
	'modules/study',
	'modules/emergency',
	'modules/campus',
	'modules/sitemap',
	'modules/room',
	'modules/opening',
	'modules/mensa',
	'modules/search'
	], function($, _, Backbone, HomePageView, StudyPageView, EmergencyPageView,	CampusPageView, SitemapPageView, RoomPageView, OpeningPageView, MensaPageView, SearchPageView){
	var AppRouter = Backbone.Router.extend({
		routes:{
			// Routes for Index - Page
			"": "home",
			"home": "home",
			"news": "news",
			"events": "events",
			"study": "study",
			"campus": "campus",
			"search": "search",
			// Routes for Campus - Page
			"sitemap": "sitemap",
			"room": "room",
			"opening": "opening",
			"mensa": "mensa",
			"emergency": "emergency"
		},

		initialize: function(){
			//this.CampusPageView = new CampusPageView();
			//this.EmergencyPageView = new EmergencyPageView();
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

		campus: function(){
			console.log("Side -> Campus");
			this.changePage(new CampusPageView);
		},

		search: function(){
			console.log("Side -> Search");
			this.changePage(new SearchPageView);
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

		changePage: function(page){

			if(!this.currentView){
				$('#pagecontainer').children().first().remove();
			}

			// prepare new view for DOM display
			$(page.el).attr('data-role', 'page');
			page.render();
			$('#pagecontainer').append($(page.el));

			var transition = $.mobile.defaultPageTransition;

			// Erste Seite nicht sliden
			if (this.firstPage){
				transition = 'none';
				this.firstPage = false;
			}

			$.mobile.changePage($(page.el), {changeHash: false, transition: transition});

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