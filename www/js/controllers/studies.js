define([
	"backboneMVC",
	"modules/calendar",
	"modules/calendar.export",
	"modules/lectures",
	"modules/grades",
	"modules/moodle"
], function(BackboneMVC) {

	/*
	 * studiesController
	 */
	app.controllers.studies = BackboneMVC.Controller.extend({
		name: 'studies',

		default: function () {

		},

		calendar: function (day) {
			if (day == 'export') {
				app.loadPage('calendarExport', 'index', {day: day});
			} else {
				app.loadPage('calendar', 'index', {day: day});
			}
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

		grades: function () {
			app.loadPage('grades', 'index');
		},

		moodle: function (action, id) { //action ist immer index, bis jemand das ändern möchte
			action = 'index';
			app.loadPage('moodle', action, {model: app.session, courseid: id});
		},

	});
});