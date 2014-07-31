/*
 *	Router
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'modules/home',
	'modules/news',
	'modules/events',
	'modules/study',
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
	'modules/sports-logic'
	], function($, _, Backbone, HomePageView, NewsPageView, EventsPageView, StudyPageView, EmergencyPageView,	CampusPageView, SitemapPageView, RoomPageView, OpeningPageView, TransportPageView, Transport2PageView, MensaPageView, LibraryPageView, LecturesPageView, GradesPageView, ImpressumPageView, SportsPageView){
	var AppRouter = Backbone.Router.extend({
		routes:{
			// Routes for Index - Page
			"": "home",
			"home": "home",
			"news": "news",
			"events": "events",
			"study": "study",
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
			"sports": "sports"
		},

		initialize: function(){
			/*
			// Handle back button throughout the application
        	$('.back').live('click', function(event) {
            	window.history.back();
            	return false;
        	});
        	this.firstPage = true;
        	*/
        	// Prepare Navigation-Panel
        	$('#nav-panel').trigger("create");
			$('#nav-panel').trigger("updatelayout");
			$('#nav-panel').panel({animate: true});
		},

		home: function(){
			this.changePage(new HomePageView);
		},

		news: function(){
			this.changePage(new NewsPageView);
		},

		events: function(){
			this.changePage(new EventsPageView);
		},

		study: function(){
			this.changePage(new StudyPageView);
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

		sports: function() {
			console.log("Side -> Sports");
			this.changePage(new SportsPageView);
		},

		changePage: function(page){
			if (this.currentView) {
				// Release memory, stop listening to events
				this.currentView.remove();
			}

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
				$('#nav-panel').css('display', 'block');
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