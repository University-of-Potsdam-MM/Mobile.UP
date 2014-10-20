define(['jquery', 'underscore', 'backbone', 'utils', 'moment'], function($, _, Backbone, utils, moment){


	/**
	 *	Course - BackboneModel
	 *	@desc	holding one single course
	 */
	var Course = Backbone.Model.extend({

		// setting starting and ending to simplify later parsing and display of daily courses
		parse: function(course){
			var split = (course.dates[0].timespan).split(' ');
			(split[1]) ? this.set('starting', split[1]) : '';
			(split[3]) ? this.set('ending', split[3]) : '';
			return course;
		}
	});


	/**
	 *	CourseList - BackboneCollection
	 * 	@desc 	holding all available courses of a user
	 */
	var CourseList = Backbone.Collection.extend({
		model: Course,
		url: 'js/json/courses-hgessner.json',
	});


	/**
	 *	CalendarDay - Backbone.Model
	 *	@desc	model for one selected day containing all relevant courses
	 */
	var CoursesForDay = Backbone.Collection.extend({
	});


	/**
	 *	CourseDetailView - BackboneView
	 *	@desc	detail view for a course
	 */
	var CourseDetailView = Backbone.View.extend({
		model: Course,
		el: '#loadingSpinner',

		initialize: function(){
			this.template = utils.rendertmpl('course_detail');
		},

		render: function(){
			console.log(this.model);
			this.$el.html(this.template({course: this.model}));
			return this;
		}
	});


	/**
	 *	CalendarDayView - BackboneView
	 * 	@desc	view for one specific day
	 */
	var CalendarDayView = Backbone.View.extend({
		collection: CoursesForDay,
		el: '#coursesForDay',
		events: {
			'click li': 'renderCourseDetails'
		},


		initialize: function(){
			this.template = utils.rendertmpl('calendar_day');
		},

		renderCourseDetails: function(ev){
			ev.preventDefault();
			console.log('renderCourseDetails');
			// get model and display view
			//this.CourseDetailView = new CourseDetailView({model: this.CourseList.at('0')});
			//this.CourseDetailView.render();
		},

		render: function(){
			this.$el.html(this.template({CoursesForDay: this.collection}));
			this.$el.trigger("create");
			return this;
		}
	});


	/**
	 *	CalendarPageView - BackboneView
	 * 	Main View fpr calendar
	 */
	var CalendarPageView = Backbone.View.extend({

		attributes: {"id": "calendar"},

		initialize: function(vars){
			this.day = vars.day;
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.listenToOnce(this, "prepareCourses", this.prepareCourses);
			this.listenTo(this, 'getCoursesForDay', this.getCoursesForDay);
			this.template = utils.rendertmpl('calendar');
		},

		prepareCourses: function(){
			console.log('prepareCourses');
			this.CoursesForDay = new CoursesForDay();
			this.CourseList = new CourseList();
			new utils.LoadingView({collection: this.CourseList, el: this.$("#loadingSpinner")});
			this.CourseList.fetch({
				success: this.fetchSuccess,
				error: this.fetchError
			});
		},

		fetchSuccess: function(){
			this.trigger('getCoursesForDay');
			console.log(this.CoursesForDay);
			this.CalendarDayView = new CalendarDayView({collection: this.CoursesForDay});
			this.CalendarDayView.render();

		},

		fetchError: function(){

		},

		// get current selected day and filter relevant courses to display
		getCoursesForDay: function(){

			// check for valid date otherwise use current day
			if (!this.day || !moment(this.day, "YYYY-MM-DD", true).isValid()){
				this.day = new Date();
			}
			day = moment(this.day);

			var coursesForDay = _.filter(this.CourseList.models, function(course){
				if (course.get('starting')){
					var courseStarting = moment(course.get('starting'), "DD.MM.YYYY");
				}
				if (course.get('ending')){
					var courseEnding = moment(course.get('ending'), "DD.MM.YYYY");
				}

				var weekdaynr = course.get('dates')[0].weekdaynr;

				if (courseStarting && courseEnding){
					return ((courseStarting < day) && (courseEnding > day) &&  (weekdaynr == day.day()))
				}

			});
			this.CoursesForDay.add(coursesForDay);
		},

		render: function(){
			this.$el.html(this.template({}));
			this.$el.trigger("create");
			this.trigger("prepareCourses");
			return this;
		}
	});

	return CalendarPageView;
});