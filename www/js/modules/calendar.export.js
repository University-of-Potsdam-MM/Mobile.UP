define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'moment',
	'Session',
	'modules/calendar.common',
	'uri/URI',
	'cache',
	'hammerjs'
], function($, _, Backbone, utils, moment, Session, calendar, URI){

	var Calendar = Backbone.Model.extend({

		importCourses: function(courses, calendarEntries) {
			var currentCourses = courses.filter(function(course) { return course.get("current") === "true"; });
			_.each(currentCourses, function(course) {
				var writeToCalendar = function(entry) {
					calendarEntries.add(entry);
				};

				_.each(course.getDates(), function(date) {
					var entry = {};
					entry.title = course.get("name");
					entry.location = date.get("room");

					entry.options = {};
					if (window.cordova) {
						entry.options = window.plugins.calendar.getCalendarOptions();
					}
					entry.options.calendarName = this.get("name");
					entry.options.calendarId = parseInt(this.get("id"));
					entry.options.url = this._cleanPulsLink(course.get("weblink"));
					// Delete reminder
					entry.options.firstReminderMinutes = 0;

					date.exportToCalendar(entry, course, writeToCalendar);
				}, this);
			}, this);
		},

		_cleanPulsLink: function(pulsLink) {
			var link = new URI(_.unescape(pulsLink));
			var filename = link.filename();
			var sessionIndex = filename.indexOf(";")
			if (sessionIndex >= 0) {
				filename = filename.substring(0, sessionIndex);
			}
			link.filename(filename);
			return link.toString();
		}
	});

	var CalendarEntry = Backbone.Model.extend({

		initialize: function() {
			_.bindAll(this, "_success", "_error");
		},

		save: function() {
			var entry = this.attributes;
			if (window.cordova) {
				window.plugins.calendar.createEventWithOptions(entry.title, entry.location, "", entry.startDate, entry.endDate, entry.options, this._success, this._error);
			}
		},

		_success: function() {
			this.set("saveStatus", "success");
			this.trigger("sync");
		},

		_error: function() {
			this.set("saveStatus", "error");
			this.trigger("error");
		}
	});

	var CalendarEntries = Backbone.Collection.extend({
		model: CalendarEntry,

		initialize: function() {
			this.listenTo(this, "add", function(model) {
				this.listenTo(model, "sync", this._triggerUpdate);
				this.listenTo(model, "error", this._triggerUpdate);
				this._triggerUpdate();
			});
			this.listenTo(this, "remove", function(model) {
				this.stopListening(model);
				this._triggerUpdate();
			});
		},

		_triggerUpdate: function() {
			this.trigger("saveStatusUpdated");
		},

		getSaveStatus: function() {
			var status = this.countBy(function(model) { return model.get("saveStatus"); });
			return _.defaults(status, {success: 0, error: 0, all: this.size()});
		},

		save: function() {
			this.each(function(model) {
				model.save();
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

	var CalendarExportStatusPageView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl('calendar.export.status');
			this.listenTo(this.collection, "saveStatusUpdated", this.render);
		},

		render: function() {
			this.$el.html(this.template({status: this.collection.getSaveStatus()}));
			return this;
		}
	});

	var CalendarSelectionPageView = Backbone.View.extend({

		events: {"click .calendar-link": "calendarSelected"},

		initialize: function(){
			this.template = utils.rendertmpl('calendar.export.selection');
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
				var calendarEntries = new CalendarEntries();
				new CalendarExportStatusPageView({el: $("#selectionStatus"), collection: calendarEntries}).render();

				setTimeout(_.bind(function() {
					calendar.importCourses(this.model.courses, calendarEntries);
					calendarEntries.save();
				}, this), 500);
			}
		},

		render: function() {
			this.$el.html(this.template({calendars: this.model.calendars}));
			this.$el.trigger("create");
			this.trigger("loadData");
			return this;
		}
	});

	/**
	 *	CalendarPageView - BackboneView
	 * 	Main View fpr calendar
	 */
	var CalendarExportPageView = Backbone.View.extend({
		
		attributes: {"id": "calendarexport"},

		initialize: function(){
			this.template = utils.rendertmpl('calendar.export');
		},

		render: function(){
			this.$el.html(this.template({}));
			new CalendarSelectionPageView({el: this.$("#selectionStatus")}).render();
			return this;
		}
	});

	return CalendarExportPageView;
});