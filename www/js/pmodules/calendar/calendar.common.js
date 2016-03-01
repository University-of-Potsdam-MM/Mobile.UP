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
	 *	CourseEvent - Backbone Model
	 *	@desc
	 */
	var CourseEvent = Backbone.Model.extend({

		_parseDuration: function(day, rawDuration) {
			var hours = parseInt(rawDuration.slice(0,2));
			var minutes = parseInt(rawDuration.slice(2,4));

			var duration = moment.duration({
				minutes: minutes,
				hours: hours
			});

			return moment(day).add(duration);
		},

		getBegin: function(day) {
			return this._parseDuration(day, this.get("startTime"));
		},

		getEnd: function(day) {
			return this._parseDuration(day, this.get("endTime"));
		}
	});


	/**
	 * SingleDate - BackboneModel
	 * @desc	extends CourseEvent,	used for single events
	 */
	var SingleEvent = CourseEvent.extend({

		isOnDay: function(day, courseStarting) {
			//console.log('SingleDate isOnDay', day, courseStarting);
			var dayContent = moment(this.get("startDate"), "DD.MM.YYYY");
			return dayContent.isSame(day);
		},

		exportToCalendar: function(entry, course, callback) {
			var split = this.get("timespan").split(' ');
			var dayContent = moment(split[1], "DD.MM.YYYY");

			entry.startDate = this.getBegin(dayContent).toDate();
			entry.endDate = this.getEnd(dayContent).toDate();

			callback(entry);
		}
	});


	/**
	 * WeeklyDate - BackboneModel
	 * @desc	extends CourseEvent,	used for weekly events
	 */
	var WeeklyEvent = CourseEvent.extend({

		isOnDay: function(day, courseStarting) {
			moment.locale("de");
			return this.get("day") == moment.weekdays(day.day());
		},

		exportToCalendar: function(entry, course, callback) {
			entry.startDate = this.getBegin(course.getStarting()).toDate();
			entry.endDate = this.getEnd(course.getStarting()).toDate();
			entry.options.recurrence = "weekly";
			//add one day to make sure last event is also synced!
			entry.options.recurrenceEndDate = moment(course.getEnding()).add(1, "days").toDate();

			callback(entry);
		}
	});


	/**
	 * BiWeeklyDate - BackboneModel
	 * @desc	extends CourseEvent,	used for bi weekly events
	 */
	var BiWeeklyEvent = CourseEvent.extend({

		isOnDay: function(day, courseStarting) {
			moment.locale("de");
			console.log('BiWeeklyDate isOnDay', day, courseStarting);
			var weeksSinceStart = day.diff(courseStarting, "weeks");
			return weeksSinceStart % 2 == 0 && this.get("day") == moment.weekdays(day.day());
		},

		exportToCalendar: function(entry, course, callback) {
			var currentDate = course.getStarting();
			var lastDate = moment(course.getEnding()).add(1, "days");

			// Android doesn't know bi-weekly dates so we have to save all dates ourselves
			// Generate new dates as long we haven't got to the end
			while (currentDate.isBefore(lastDate)) {
				var temp = _.clone(entry);
				temp.startDate = this.getBegin(currentDate).toDate();
				temp.endDate = this.getEnd(currentDate).toDate();
				callback(temp);

				currentDate.add(2, "weeks");
			}
		}
	});


	/**
	 *	Course - BackboneModel
	 *	@desc	holding one single course with all events
	 *  TODO: refactor to be a collection out of event models
	 */
	var Course = Backbone.Model.extend({

		// setting starting and ending to simplify later parsing and display of daily courses
		parse: function(course){
			if (!$.isArray(course.events.event)) {
				course.events.event = [course.events.event];
			}

			// We need to find the earliest and the latest date available
			// We expect the following format:
			// 02.02.2016
			var events = course.events.event;

			var startDates = _.pluck(events, 'startDate');
			var endDates =  _.pluck(events, 'endDate');
			var list = startDates.concat(endDates);

			var result = _.map(list, function(date) {
				return moment(date, "DD.MM.YYYY");
			}).sort(function(a, b) {
				if (a.isBefore(b)) return -1;
				else if (a.isAfter(b)) return 1;
				else return 0;
			});

			var starting = _.first(result);
			var ending = _.last(result);

			if (starting) this.set('starting', starting.format("DD.MM.YYYY"));
			if (ending) this.set('ending', ending.format("DD.MM.YYYY"));

			return course;
		},

		getEvents: function() {
			return _.map(this.get("events").event, function(event) {
				//console.log(event);
				if (event.rhythm === "Einzeltermin" || event.rhythm === "Termin") {
					return new SingleEvent(event);
				} else if (event.rhythm === "wöchentlich") {
					return new WeeklyEvent(event);
				} else if (event.rhythm === "14-täglich") {
					return new BiWeeklyEvent(event);
				} else {
					console.log("Unknown rhythm " + event.rythm);
					this.logUnknownCourseRhythm(event.rythm);
					return new WeeklyEvent(event);
				}
			}, this);
		},

		logUnknownCourseRhythm: function(rhythm) {
			var model = new Backbone.Model();
			model.url = "https://api.uni-potsdam.de/endpoints/errorAPI/rest/courses";
			model.set("courseName", this.get("name"));
			model.set("rhythm", rhythm);
			model.save();
		},

		getStarting: function() {
			var courseStarting = undefined;
			if (this.get('starting')){
				courseStarting = moment(this.get('starting'), "DD.MM.YYYY");
			}
			return courseStarting;
		},

		getEnding: function() {
			var courseEnding = undefined;
			if (this.get('ending')){
				courseEnding = moment(this.get('ending'), "DD.MM.YYYY");
			}
			return courseEnding;
		}
	});


	/**
	 * Courses - BackboneCollection
	 * @desc	used for timeslots
	 */
	var Courses = Backbone.Collection.extend({
		model: Course
	});


	/**
	 *	CourseList - BackboneCollection
	 * 	@desc 	holding all available courses of a user (present and past courses)
	 */
	var CourseList = Backbone.Collection.extend({
		model: Course,
		url: 'js/json/hgessner.json',

		initialize: function(){
			//console.log(this);
			this.session = new Session();
			//this.url = "https://esb.soft.cs.uni-potsdam.de:8244/services/pulsTest/getStudentCourses";
			//this.url= "https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/getLectureScheduleRoot";
			//this.request = '{"condition": {"semester": "0", "allLectures": "1"}, "user-auth": {"username" : "'+this.session.get('up.session.username')+'", "password": "'+this.session.get('up.session.password')+'"}}';
		},

		parse: function(response) {
			return response.studentCourses.student.pastCourses.course;
		},

		// filters courses and events for the day
		// the events for the day are added as currentEvents
		filterByDay: function(day) {

			return _.filter(this.models, function(course){
				var courseStarting = course.getStarting();
				var courseEnding = course.getEnding();

				var containsCurrentDay = false;

				if (courseStarting <= day && courseEnding >= day ) {
					// iterate over all events of a course and save the current one in currentEvent
					var courseEvents = course.getEvents();
					//console.log('coursedates', courseEvents);
					var result = [];
					for(var i=0; i < courseEvents.length; i++){
						var courseEvent = courseEvents[i];
						if (courseEvent.isOnDay(day, courseStarting)) {
							containsCurrentDay = true;
							result.push(courseEvent);
						}
					}
					course.set('currentEvents', result);
				}
				return containsCurrentDay;
			}, this);
		}
	});


	/**
	 *	CourseSlot - BackboneModel
	 *	@desc	model for a courseslot / timeslot for a given day, consists of a timeslot and a course model if available
	 */
	var CourseSlot = Backbone.Model.extend({
		defaults: {
			"timeSlotBegin": "",
			"timeSlotEnd": "",
			collection: Courses
		}
	});


	/**
	 *	CourseSlots - BackboneCollection
	 *	@desc	collection holding all timeslots for a day
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
				courseslot.set('timeSlotBegin', (parseInt("0800", 10)+i*200).toString());
				courseslot.set('timeSlotEnd', (parseInt("1000", 10)+i*200).toString());
				this.add(courseslot);
			}
			this.models[0].set('timeSlotBegin', '0800');
		},

		triggerReset: function() {
			//console.log('reset');
			this.resetCoursesForDay();
		},

		resetCoursesForDay: function() {
			if (this.courseList.length == 0) {
				this.reset();
				this.trigger("coursesEmpty");
			} else {
				this.coursesForDay.reset(this.courseList.filterByDay(this.day));
			}
		},

		findByTimeslot: function(courseSlot) {

			var timeSlotBegin = courseSlot.get('timeSlotBegin');
			var timeSlotEnd = courseSlot.get('timeSlotEnd');
			var timeSlotCourses = new Courses();

			var courseEvents = this.coursesForDay.each(function(course){

				var events = course.get('currentEvents');
				var timeSlotEvent = events.filter(function(event){
					//console.log(event);
					var eventBegin = event.get('startTime').replace(':', '');
					var eventEnd = event.get('endTime').replace(':', '');
					//console.log(course, eventBegin, eventEnd, timeSlotBegin, timeSlotEnd);

					// A course should belong to a timeslot if one of the following is true
					// 1. The course starts within the timeslot
					// 2. The course ends within the timeslot
					// 3. The course starts before and ends after the timeslot
					if (((eventBegin < timeSlotEnd) && (eventBegin >= timeSlotBegin)) ||
						((eventEnd <= timeSlotEnd) && (eventEnd > timeSlotBegin)) ||
						((eventBegin < timeSlotBegin) && (eventEnd > timeSlotEnd))) {
						return true;
					}
				});
				//console.log(course);

				if (timeSlotEvent.length != 0){
					course.set('timeSlotEvent', timeSlotEvent[0]);
					timeSlotCourses.add(course);
				}
				//console.log(matchingEvents, course);
			});
			courseSlot.set({collection: timeSlotCourses});
			//console.log('courseEvents', courseSlot);
		},

		sortIntoTimeslots: function() {
			// iterate over courseslots and paste courses and events in
			_.each(this.models, function(courseslot) {
				this.findByTimeslot(courseslot);
			}, this);
			this.trigger("timeSlotsReady");
		}
	});

	return {
		Course: Course,
		Courses: Courses,
		CourseList: CourseList,
		SingleEvent: SingleEvent,
		WeeklyEvent: WeeklyEvent,
		BiWeeklyEvent: BiWeeklyEvent,
		CourseSlot: CourseSlot,
		CourseSlots: CourseSlots
	};
});