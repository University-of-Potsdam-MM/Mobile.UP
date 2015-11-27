define([
	"backboneMVC",
	"backbone",
	"modules/sitemap",
	"modules/room",
	"modules/opening",
	"modules/transport",
	"modules/transport2",
	"modules/mensa",
	"modules/emergency",
	"modules/library",
	"modules/people",
	"modules/impressum"
], function(BackboneMVC, Backbone) {

	/*
	 * CampusController
	 */
	app.controllers.campus = BackboneMVC.Controller.extend({
		name: 'campus',
		/*
		 * Um Initialisierungsfunktionen auszuführen
		 */
		init:function(){
		},

		default:function(){
			this.index();
		},

		sitemap:function(){
			app.loadPage('sitemap', 'index');
		},

		room:function(){
			app.loadPage('room', 'index');
		},

		opening:function(){
			app.loadPage('opening', 'index');
		},

		transport:function(type, campus){
			if(type == 'plan')
				app.loadPage('transport2', 'index');
			else
				app.loadPage('transport', 'index');
		},

		mensa:function(){
			app.loadPage('mensa', 'index');
		},

		emergency:function(){
			app.loadPage('emergency', 'index');
		},

		library:function(detail){
			console.log(Backbone.history.fragment.replace('detail', ''));
			if(detail == 'detail')
				app.route(Backbone.history.fragment.replace('detail', ''), true, true);
			app.loadPage('library', 'index');
		},

		people:function(){
			app.loadPage('people', 'index');
		},

		impressum:function(){
			app.loadPage('impressum', 'index');
		},
	});
});