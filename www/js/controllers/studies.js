define([
	"backboneMVC",
	"controllers/baseController",
	"modules/moodle"
], function(BackboneMVC, BaseController) {

	/*
	 * studiesController
	 */
	app.controllers.studies = BaseController.extend({
		name: 'studies',

		default: function () {

		},

		user_moodle: function (action, id) { //action ist immer index, bis jemand das ändern möchte
			action = 'index';
			app.loadPage('moodle', action, {model: app.session, courseid: id});
		},

	});
});