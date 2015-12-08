define([
	"backboneMVC",
	"backbone",
	"controllers/baseController",
	"modules/transport",
	"modules/transport2",
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

		transport:function(type, campus){
			if(type == 'plan')
				app.loadPage('transport2', 'index');
			else
				app.loadPage('transport', 'index');
		},

		user_people:function(){
			app.loadPage('people', 'index');
		},

		impressum:function(){
			app.loadPage('impressum', 'index');
		},
	});
});