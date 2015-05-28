define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'moment',
	'Session',
	'modules/calendar.common',
	'cache',
	'hammerjs'
], function($, _, Backbone, utils, moment, Session, calendar){

	var Calendar = Backbone.Model.extend({

		importCourses: function(courses) {
			var currentCourses = courses.filter(function(course) { return course.get("current") === "true"; });
			_.each(currentCourses, function(course) {
				var writeToCalendar = function(entry) {
					console.log(entry);
				};

				_.each(course.getDates(), function(date) {
					var entry = {};
					entry.title = course.get("name");
					entry.location = date.get("room");
					date.exportToCalendar(entry, writeToCalendar);
				});
			});
		}
	});

	var Calendars = Backbone.Collection.extend({
		model: Calendar,

		initialize: function() {
			_.bindAll(this, "success", "error");
		},

		error: function() {
			this.trigger("error");
		},

		success: function(response) {
			this.set(response);
			this.trigger("sync");
		},

		fetch: function() {
			if (window.cordova) {
				window.plugins.calendar.listCalendars(this.success, this.error);
			} else {
				alert("Der Kalenderexport funktioniert nur in der App.");
				//this.error();
				this.success([{"id": "1", "name": "Testeintrage"}]);
			}
		}
	});

	/*
	 * Loads courses first and calendars second. Triggers "sync" if all data is loaded and "error" if an error occured.
	 */
	var CalendarsAndCourses = Backbone.Model.extend({

		initialize: function() {
			this.calendars = new Calendars();
			this.courses = new calendar.CourseList();
			var coursesAdapter = new utils.FullySyncedAdapter(undefined, {subject: this.courses});

			this.listenTo(coursesAdapter, "fullysynced", this.coursesSynced);
			this.listenTo(this.calendars, "sync", this.calendarsSynced);
			this.listenTo(this.calendars, "error", this.calendarsError);
		},

		coursesSynced: function() {
			if (this.courses.isEmpty()) {
				this.trigger("error");
			} else {
				this.calendars.fetch();
			}
		},

		calendarsSynced: function() {
			this.trigger("sync");
		},

		calendarsError: function() {
			this.trigger("error");
		},

		fetch: function() {
			this.trigger("request");
			this.courses.fetch(utils.cacheDefaults());
		}
	});

	/**
	 *	CalendarPageView - BackboneView
	 * 	Main View fpr calendar
	 */
	var CalendarExportPageView = Backbone.View.extend({
		
		attributes: {"id": "calendarexport"},

		events: {"click .calendar-link": "calendarSelected"},

		initialize: function(){
			this.template = utils.rendertmpl('calendar.export');
			this.model = new CalendarsAndCourses();

			this.listenTo(this.model, "sync", this.render);
			this.listenTo(this.model, "error", this.errorHandler);
			this.listenToOnce(this, "loadData", this.loadData);
		},

		loadData: function() {
			new utils.LoadingView({collection: this.model, el: this.$("#loadingSpinner")});
			this.model.fetch();
		},

		errorHandler: function(error){
			var errorPage = new utils.ErrorView({el: '#loadingError', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'calendarexport', err: error});
		},

		calendarSelected: function(event) {
			event.preventDefault();

			var calendarId = $(event.target).attr("href").slice(1);
			var calendar = this.model.calendars.find(function(calendar) { return calendar.get("id") === calendarId });
			if (calendar) {
				calendar.importCourses(this.model.courses);
			}
		},

		render: function(){
			this.$el.html(this.template({calendars: this.model.calendars}));
			this.$el.trigger("create");
			this.trigger("loadData");
			return this;
		}
	});

	return CalendarExportPageView;
});