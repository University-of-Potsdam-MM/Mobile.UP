define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'moment',
	'Session',
	'cache',
	'hammerjs'
], function($, _, Backbone, utils, moment, Session){


	/**
	 *	Course - BackboneModel
	 *	@desc	holding one single course
	 */
	var Course = Backbone.Model.extend({

		// setting starting and ending to simplify later parsing and display of daily courses
		parse: function(course){
			if (!$.isArray(course.dates)) {
				course.dates = [course.dates];
			}

			var split = (course.dates[0].timespan).split(' ');
			(split[1]) ? this.set('starting', split[1]) : '';
			(split[3]) ? this.set('ending', split[3]) : '';
			return course;
		}
	});

	var Courses = Backbone.Collection.extend({
		model: Course
	});


	/**
	 *	CourseList - BackboneCollection
	 * 	@desc 	holding all available courses of a user (present and past courses)
	 */
	var CourseList = Backbone.Collection.extend({
		model: Course,

		initialize: function(){
			this.session = new Session();
			this.url = "https://api.uni-potsdam.de/endpoints/pulsAPI?action=course&auth=H2LHXK5N9RDBXMB&datatype=json";
			this.url += "&user=" + encodeURIComponent(this.session.get('up.session.username'));
			this.url += "&password=" + encodeURIComponent(this.session.get('up.session.password'));
		},

		parse: function(response) {
			return response.jsonArray.jsonElement;
		},

		filterByDay: function(day) {
			var isBefore = function(a, b) {
				if (a)
					return a >= b;
				else
					return true;
			};

			return _.filter(this.models, function(course){
				if (course.get('starting')){
					var courseStarting = moment(course.get('starting'), "DD.MM.YYYY");
				}
				if (course.get('ending')){
					var courseEnding = moment(course.get('ending'), "DD.MM.YYYY");
				}
				var containsCurrentDay = false;

				if (courseStarting && courseStarting <= day && isBefore(courseEnding, day)) {
					// iterate over all dates of a course
					var coursedates = course.get('dates');
					var result = [];
					for(var i=0; i < coursedates.length; i++){
						var focusDate = coursedates[i];

						if (focusDate.rythm === "Einzeltermin") {
							var split = focusDate.timespan.split(' ');
							var dayContent = moment(split[1], "DD.MM.YYYY");
							if (dayContent.isSame(day)) {
								containsCurrentDay = true;
								result.push(i);
								course.set('currentDate', result);
							}
						} else if (focusDate.rythm === "wöchentlich") {
							if (focusDate.weekdaynr == day.day()) {
								containsCurrentDay = true;
								result.push(i);
								course.set('currentDate', result);
							}
						} else {
							console.log("Unknown rhythm " + focusDate.rythm)
							if (focusDate.weekdaynr == day.day()) {
								containsCurrentDay = true;
								result.push(i);
								course.set('currentDate', result);
							}
						}
					}
				}
				return containsCurrentDay;
			});
		}
	});


	/**
	 *	CourseSlot - BackboneModel
	 *	@desc	model for a courseslot / timeslot for a given day
	 *			consists of a timeslot and a course model if available
	 */
	var CourseSlot = Backbone.Model.extend({
		defaults: {
			"timeslotbegin": "",
			"timeslotend": "",
			collection: Courses
		}
	});


	/**
	 *	CourseSlots - BackboneCollection
	 *	@desc	colletion holding all timeslots for a day
	 */
	var CourseSlots = Backbone.Collection.extend({
		model: CourseSlot,

		initialize: function(models, options){
			this.coursesForDay = new Backbone.Collection();
			this.courseList = options.courseList;
			this.day = options.day;

			this.listenTo(this.coursesForDay, "reset", this.sortIntoTimeslots);
			this.listenTo(this.courseList, "sync", this.triggerReset);

			for (var i=0; i<7; i++){
				var courseslot = new CourseSlot();
				courseslot.set('timeslotbegin', (parseInt("0800", 10)+i*200).toString());
				courseslot.set('timeslotend', (parseInt("1000", 10)+i*200).toString());
				this.add(courseslot);
			}
			this.models[0].set('timeslotbegin', '0800');
		},

		triggerReset: function() {
			this.resetCoursesForDay();
		},

		resetCoursesForDay: function() {
			if (this.courseList.length == 0) {
				this.reset();
				this.trigger("timeslotsReady");
			} else {
				this.coursesForDay.reset(this.courseList.filterByDay(this.day));
			}
		},

		findByTimeslot: function(timeslotBegin, timeslotEnd) {
			return _.chain(this.coursesForDay.models)
				.map(function(course) {
					var result = [];

					var currentDate = course.get('currentDate');
					for (var i = 0; i < currentDate.length; i++) {
						var courseTimes = course.get('dates')[currentDate[i]];
						var clonedCourse = course.clone();
						clonedCourse.set("dates", courseTimes);
						result.push(clonedCourse);
					}

					return result;
				})
				.flatten(true)
				.filter(function(course) {
					var courseBegin = course.get("dates").begin;
					var courseEnd = course.get("dates").end;

					if (((courseBegin < timeslotEnd) && (courseBegin >= timeslotBegin)) ||
						((courseEnd <= timeslotEnd) && (courseEnd > timeslotBegin))){
						return true;
					}
				})
				.value();
		},

		sortIntoTimeslots: function() {
			// iterate over collection and paste into timetable array
			_.each(this.models, function(courseslot) {
				var timeslotBegin = courseslot.get('timeslotbegin');
				var timeslotEnd = courseslot.get('timeslotend');
				var timeSlotCourses = new Courses();
				
				var clonedCourses = this.findByTimeslot(timeslotBegin, timeslotEnd);
				timeSlotCourses.add(clonedCourses);
				courseslot.set({collection: timeSlotCourses});
			}, this);
			this.trigger("timeslotsReady");
		}
	});


	/**
	 *	CalendarDayView - BackboneView
	 * 	@desc	view for one specific day
	 */
	var CalendarDayView = Backbone.View.extend({

		initialize: function(){
			this.template = utils.rendertmpl('calendar_day');
			this.listenTo(this.collection, "timeslotsReady", this.render);
		},

		render: function(){
			if (this.collection.length == 0) {
				var errorPage = new utils.ErrorView({el: this.$el, msg: 'Keine Kurse gefunden', module: 'calendar'});
			} else {
				this.$el.html(this.template({CourseSlots: this.collection}));
				this.$el.trigger("create");
			}
			return this;
		}
	});


	/**
	 *	CalendarPageView - BackboneView
	 * 	Main View fpr calendar
	 */
	var CalendarPageView = utils.GesturesView.extend({
		
		attributes: {"id": "calendar"},

		events: {
			'swipeleft': 'navigateForward',
			'swiperight': 'navigateBackward'
		},

		initialize: function(vars){
			// get passed day parameter and init collections
			this.day = vars.day;
			// check for valid date otherwise use current day
			if (!this.day || !moment(this.day, "YYYY-MM-DD", true).isValid()){
				this.day = new Date();
			}
			day = moment(this.day);

			//check if response request present
			this.CourseList = new CourseList();

			this.listenTo(this.CourseList, "error", this.errorHandler);

			this.listenToOnce(this, "prepareCourses", this.prepareCourses);
			this.listenTo(this, 'errorHandler', this.errorHandler);

			this.template = utils.rendertmpl('calendar');
		},

		navigateBackward: function(ev){
			var route = '#calendar/'+moment(day).add(-1, 'd').format('YYYY-MM-DD');
			$.mobile.changePage.defaults.reverse = 'reverse';
			Backbone.history.navigate(route, { trigger : true });
		},

		navigateForward: function(ev){
			var route = '#calendar/'+moment(day).add(1, 'd').format('YYYY-MM-DD');
			$.mobile.changePage.defaults.reverse = false;
			Backbone.history.navigate(route, { trigger : true });
		},

		prepareCourses: function(){
			var courseSlots = new CourseSlots(undefined, { courseList: this.CourseList, day: day });

			new CalendarDayView({collection: courseSlots, el: this.$("#coursesForDay")});
			new utils.LoadingView({collection: this.CourseList, el: this.$("#loadingSpinner")});

			this.CourseList.fetch(utils.cacheDefaults());
		},

		errorHandler: function(error){
			var errorPage = new utils.ErrorView({el: '#coursesForDay', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'calendar', err: error});
		},

		render: function(){
			this.$el.html(this.template({day: this.day}));
			this.$el.trigger("create");
			this.trigger("prepareCourses");
			return this;
		}
	});

	return CalendarPageView;
});