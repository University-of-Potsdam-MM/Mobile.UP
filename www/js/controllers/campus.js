define([
	"backboneMVC",
	"backbone",
	"controllers/baseController",
	"modules/room",
	"modules/opening",
	"modules/transport",
	"modules/transport2",
	"modules/emergency",
	"modules/library",
	"modules/people",
	"modules/impressum"
], function(BackboneMVC, Backbone, BaseController) {

	/*
	 * CampusController
	 */
	app.controllers.campus = BaseController.extend({
		name: 'campus',

		default:function(){
			this.index();
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

		emergency:function(){
			app.loadPage('emergency', 'index');
		},

		library:function(detail){
			console.log(Backbone.history.fragment.replace('detail', ''));
			if(detail == 'detail')
				app.route(Backbone.history.fragment.replace('detail', ''), true, true);
			app.loadPage('library', 'index');
		},

		user_people:function(){
			app.loadPage('people', 'index');
		},

		impressum:function(){
			app.loadPage('impressum', 'index');
		},
	});
});