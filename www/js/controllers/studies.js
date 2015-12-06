define([
	"backboneMVC",
	"controllers/baseController",
	"modules/lectures",
	"modules/moodle"
], function(BackboneMVC, BaseController) {

	/*
	 * studiesController
	 */
	app.controllers.studies = BaseController.extend({
		name: 'studies',

		default: function () {

		},

		lectures: function (vvzUrls) {
			var _this = this;
			app.loadPage('lectures', 'index').done(function () {
				var vvzHistory = app.currentView.vvzHistory;
				console.log(vvzUrls);
				if (vvzUrls != undefined) {
					vvzHistory.reset(JSON.parse(vvzUrls));
				} else {
					vvzHistory.reset();
				}

				/*_this.listenTo(app.currentView, "openVvzUrl", function(vvzHistory) {
				 var param = JSON.stringify(vvzHistory.toJSON());
				 var url = "studies/lectures/" + encodeURIComponent(param)
				 });*/
			});
		},

		user_moodle: function (action, id) { //action ist immer index, bis jemand das ändern möchte
			action = 'index';
			app.loadPage('moodle', action, {model: app.session, courseid: id});
		},

	});
});