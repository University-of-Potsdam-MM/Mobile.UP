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
	'modules/transport',
	'modules/transport2',
	'modules/mensa',
	'modules/library',
	'modules/lectures',
	'modules/grades'
	], function($, _, Backbone, HomePageView, StudyPageView, EmergencyPageView,	CampusPageView, SitemapPageView, RoomPageView, OpeningPageView, TransportPageView, Transport2PageView, MensaPageView, LibraryPageView, LecturesPageView, GradesPageView){
	var AppRouter = Backbone.Router.extend({
		routes:{
			// Routes for Index - Page
			"": "home",
			"nav-panel": "navpanel",
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
			"grades":"grades"
				
				
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

		changePage: function(page){

			// prepare new view for DOM display
			$(page.el).attr('data-role', 'page');
			page.render();
			// $('body').css('overflow', 'hidden');
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