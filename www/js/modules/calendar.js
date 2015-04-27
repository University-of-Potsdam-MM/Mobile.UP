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
	 *	CalendarDay - Backbone.Model
	 *	@desc	model for one selected day containing all relevant courses
	 *			ordering will be done by timeslots
	 */
	var CoursesForDay = Backbone.Collection.extend({
		model: Course
		//comparator: ''
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

		initialize: function(){
			for (var i=0; i<7; i++){
				var courseslot = new CourseSlot();
				courseslot.set('timeslotbegin', (parseInt("0800", 10)+i*200).toString());
				courseslot.set('timeslotend', (parseInt("1000", 10)+i*200).toString());
				this.add(courseslot);
			}
			this.models[0].set('timeslotbegin', '0800');
		}
	});


	/**
	 *	CalendarDayView - BackboneView
	 * 	@desc	view for one specific day
	 */
	var CalendarDayView = Backbone.View.extend({
		collection: CoursesForDay,

		initialize: function(){
			this.template = utils.rendertmpl('calendar_day');
			this.listenTo(this.collection, "reset", this.prepareDaySchedule);
			this.listenTo(this, "render", this.render);
			this.CourseSlots = new CourseSlots();
		},

		prepareDaySchedule: function(){
			// TODO: Better to transform it to collection
			var that = this;
			// iterate over collection and paste into timetable array
			_.each(this.CourseSlots.models, function(courseslot){
				var timeslotBegin = courseslot.get('timeslotbegin');
				var timeslotEnd = courseslot.get('timeslotend');
				var timeSlotCourses = new Courses();
				//console.log(timeSlotCourses);
				_.each(that.collection.models, function(course){
					var addToTimeslot = function(course, courseTimes) {
						var courseBegin = courseTimes.begin;
						var courseEnd = courseTimes.end;

						//if ((timeslotbegin <= courseBegin) && (courseEnd <= timeslotend)){
						if (((courseBegin < timeslotEnd) && (courseBegin >= timeslotBegin)) ||
							((courseEnd <= timeslotEnd) && (courseEnd > timeslotBegin))){
							timeSlotCourses.add(course);
							//console.log(timeSlotCourses);
						}
					};

					var currentDate = course.get('currentDate');
					if ($.isArray(currentDate)) {
						for (var i = 0; i < currentDate.length; i++) {
							var courseTimes = course.get('dates')[currentDate[i]];
							addToTimeslot(course, courseTimes);
						}
					} else {
						console.log("currentDate should be an array");
					}
				});
				courseslot.set({collection: timeSlotCourses});
			});
			this.trigger("render");
		},

		render: function(){
			this.$el.html(this.template({CourseSlots: this.CourseSlots}));
			this.$el.trigger("create");
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
			this.CoursesForDay = new CoursesForDay();

			this.listenTo(this.CourseList, "sync", this.renderDay);
			this.listenTo(this.CourseList, "error", this.errorHandler);

			this.listenToOnce(this, "prepareCourses", this.prepareCourses);
			this.listenTo(this, 'getCoursesForDay', this.getCoursesForDay);
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
			new CalendarDayView({collection: this.CoursesForDay, el: this.$("#coursesForDay")});
			new utils.LoadingView({collection: this.CourseList, el: this.$("#loadingSpinner")});

			this.CourseList.fetch(utils.cacheDefaults());
		},

		renderDay: function(){
			if (this.CourseList.length ==0){
				var errorPage = new utils.ErrorView({el: '#coursesForDay', msg: 'Keine Kurse gefunden', module: 'calendar'});
			}else{
				this.trigger('getCoursesForDay');
			}
		},

		errorHandler: function(error){
			var errorPage = new utils.ErrorView({el: '#coursesForDay', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'calendar', err: error});
		},

		// get current selected day and filter relevant courses to display
		getCoursesForDay: function(){
			// filter out all courses relevant for the current date
			var coursesForDay = this.CourseList.filterByDay(day);

			this.CoursesForDay.reset(coursesForDay);
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