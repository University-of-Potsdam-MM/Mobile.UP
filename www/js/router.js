/*
 *	Router
 */
define([
	'modules/study',
	'modules/emergency',
	'modules/campus',
	'modules/opening'], function(
		StudyPageView,
		EmergencyPageView,
		CampusPageView,
		OpeningPageView
		) {
	var AppRouter = Backbone.Router.extend({
		routes:{
			// Routes for Index - Page
			"": "home",
			"news": "news",
			"events": "events",
			"study": "study",
			"campus": "campus",
			"search": "search",
			// Routes for Campus - Page
			"sitemap": "sitemap",
			"opening": "opening",
			"emergency": "emergency"
		},

		initialize: function(){
			//this.CampusPageView = new CampusPageView();
			//this.EmergencyPageView = new EmergencyPageView();
		},

		home: function(){

		},

		news: function(){

		},

		events: function(){

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
			console.log('changePage - render', page);
			// clean up old view from DOM
			if (this.currentView) {
				this.currentView.remove();
			}

			// prepare new view for DOM display
			$(page.el).attr('data-role', 'page');
			page.render();
			this.currentView = page;

			$('body').append($(page.el));
			var transition = $.mobile.defaultPageTransition;
			// Erste Seite nicht sliden
			if (this.firstPage){
				transition = 'none';
				this.firstPage = false;
			}
			$.mobile.changePage($(page.el), {changeHash: false, transition: transition});
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