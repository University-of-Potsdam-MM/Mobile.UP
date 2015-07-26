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

		initialize: function() {
			this.entries = new CalendarEntries();
		},

		importCourses: function(courses) {
			var options = {};
			if (window.cordova) {
				options = window.plugins.calendar.getCalendarOptions();
			}

			var currentCourses = courses.filter(function(course) { return course.get("current") === "true"; });
			_.each(currentCourses, function(course) {
				var writeToCalendar = _.bind(function(entry) {
					this.entries.add(entry);
				}, this);

				_.each(course.getDates(), function(date) {
					var entry = {};
					entry.title = course.get("name");
					entry.location = date.get("room");

					entry.options = _.clone(options);
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
			} else {
				console.log(entry);
				this._error();
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
				this.listenTo(model, "sync", this._saveNext);
				this.listenTo(model, "error", this._saveNext);
			});
			this.listenTo(this, "remove", function(model) {
				this.stopListening(model);
			});
		},

		_saveNext: function() {
			this.trigger("saveStatusUpdated");

			if (this.size() > this.saveIndex) {
				var model = this.at(this.saveIndex);
				this.saveIndex++;
				_.defer(function() { model.save(); });
			}
		},

		getSaveStatus: function() {
			var status = this.countBy(function(model) { return model.get("saveStatus"); });
			var result = _.defaults(status, { success: 0, error: 0, all: this.size() });
			result.syncCompleted = (result.success + result.error === result.all) && !this.isEmpty();
			return result;
		},

		save: function() {
			this.saveIndex = 0;
			this._saveNext();
		}
	});

	var Calendars = Backbone.Collection.extend({
		model: Calendar,

		fetch: function(options) {
			var success = _.bind(function(response) {
				this.set(response);
				if (options.success) options.success.call(this, this);
				this.trigger("sync");
			}, this);

			var error = _.bind(function() {
				if (options.error) options.error(this);
				this.trigger("error");
			}, this);

			if (window.cordova) {
				window.plugins.calendar.listCalendars(success, error);
			} else {
				alert("Der Kalenderexport funktioniert nur in der App.");
				success([{"id": "1", "name": "Testeintrage"}]);
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
		},

		fetch: function() {
			this.trigger("request");

			var fetchCalendars = function() {
				if (this.courses.isEmpty()) {
					this.trigger("error");
				}

				this.calendars.fetch({
					success: _.bind(this.trigger, this, "sync"),
					error: _.bind(this.trigger, this, "error")
				});
			};

			this.courses.fetch(utils.cacheDefaults({
				success: _.bind(fetchCalendars, this),
				error: _.bind(this.trigger, this, "error")
			}));
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
				new CalendarExportStatusPageView({el: $("#selectionStatus"), collection: calendar.entries}).render();

				calendar.importCourses(this.model.courses);
				calendar.entries.save();
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