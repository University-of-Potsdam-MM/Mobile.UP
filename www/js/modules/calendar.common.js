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

			var date = _.find(course.dates, function(date) {
				return date.timespan && date.timespan !== "";
			});
			var timespan = date ? date.timespan : "";
			var split = timespan.split(' ');
			(split[1]) ? this.set('starting', split[1]) : '';
			(split[3]) ? this.set('ending', split[3]) : '';
			return course;
		},

		getDates: function() {
			return _.map(this.get("dates"), function(date) {
				if (date.rythm === "Einzeltermin" || date.rythm === "Termin") {
					return new SingleDate(date);
				} else if (date.rythm === "wöchentlich") {
					return new WeeklyDate(date);
				} else if (date.rythm === "14-täglich") {
					return new BiWeeklyDate(date);
				} else {
					console.log("Unknown rhythm " + date.rythm);
					return new WeeklyDate(date);
				}
			});
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
			var isBefore = function(ending, today) {
				if (ending)
					return today.isBefore(ending, "day") || today.isSame(ending, "day");
				else
					return true;
			};

			return _.filter(this.models, function(course){
				var courseStarting = course.getStarting();
				var courseEnding = course.getEnding();

				var containsCurrentDay = false;

				if (courseStarting && courseStarting <= day && isBefore(courseEnding, day)) {
					// iterate over all dates of a course
					var coursedates = course.getDates();
					var result = [];
					for(var i=0; i < coursedates.length; i++){
						var dateModel = coursedates[i];
						if (dateModel.isOnDay(day, courseStarting)) {
							containsCurrentDay = true;
							result.push(i);
							course.set('currentDate', result);
						}
					}
				}
				return containsCurrentDay;
			}, this);
		}
	});

	var CourseDate = Backbone.Model.extend({

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
			return this._parseDuration(day, this.get("begin"));
		},

		getEnd: function(day) {
			return this._parseDuration(day, this.get("end"));
		}
	});

	var SingleDate = CourseDate.extend({

		isOnDay: function(day, courseStarting) {
			var split = this.get("timespan").split(' ');
			var dayContent = moment(split[1], "DD.MM.YYYY");
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

	var WeeklyDate = CourseDate.extend({

		isOnDay: function(day, courseStarting) {
			return this.get("weekdaynr") == day.day();
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

	var BiWeeklyDate = CourseDate.extend({
		
		isOnDay: function(day, courseStarting) {
			var weeksSinceStart = day.diff(courseStarting, "weeks");
			return weeksSinceStart % 2 == 0 && this.get("weekdaynr") == day.day();
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
				this.trigger("coursesEmpty");
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

					// A course should belong to a timeslot if one of the following is true
					// 1. The course starts within the timeslot
					// 2. The course ends within the timeslot
					// 3. The course starts before and ends after the timeslot
					if (((courseBegin < timeslotEnd) && (courseBegin >= timeslotBegin)) ||
						((courseEnd <= timeslotEnd) && (courseEnd > timeslotBegin)) ||
						((courseBegin < timeslotBegin) && (courseEnd > timeslotEnd))) {
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

	return {
		Course: Course,
		Courses: Courses,
		CourseList: CourseList,
		SingleDate: SingleDate,
		WeeklyDate: WeeklyDate,
		BiWeeklyDate: BiWeeklyDate,
		CourseSlot: CourseSlot,
		CourseSlots: CourseSlots
	};
});