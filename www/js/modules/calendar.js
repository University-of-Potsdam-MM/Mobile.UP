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
			'swiperight': 'navigateBackward',
			'click #export': 'exportToCalendar'
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
			this.CourseList = new calendar.CourseList();

			this.listenTo(this.CourseList, "error", this.errorHandler);

			this.listenToOnce(this, "prepareCourses", this.prepareCourses);
			this.listenTo(this, 'errorHandler', this.errorHandler);

			this.template = utils.rendertmpl('calendar');
		},

		navigateBackward: function(ev){
			var route = '#calendar/day/'+moment(day).add(-1, 'd').format('YYYY-MM-DD');
			$.mobile.changePage.defaults.reverse = 'reverse';
			Backbone.history.navigate(route, { trigger : true });
		},

		navigateForward: function(ev){
			var route = '#calendar/day/'+moment(day).add(1, 'd').format('YYYY-MM-DD');
			$.mobile.changePage.defaults.reverse = false;
			Backbone.history.navigate(route, { trigger : true });
		},

		prepareCourses: function(){
			var courseSlots = new calendar.CourseSlots(undefined, { courseList: this.CourseList, day: day });

			new CalendarDayView({collection: courseSlots, el: this.$("#coursesForDay")});
			new utils.LoadingView({collection: this.CourseList, el: this.$("#loadingSpinner")});

			this.CourseList.fetch(utils.cacheDefaults());
		},

		errorHandler: function(error){
			var errorPage = new utils.ErrorView({el: '#coursesForDay', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'calendar', err: error});
		},

		exportToCalendar: function(event) {
			event.preventDefault();
			this.CourseList.exportToCalendar();
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