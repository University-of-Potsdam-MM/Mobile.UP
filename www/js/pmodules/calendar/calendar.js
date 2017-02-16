define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'moment',
	'Session',
	'pmodules/calendar/calendar.common',
	'cache',
	'hammerjs'
], function($, _, Backbone, utils, moment, Session, calendar){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/calendar");

	/**
	 *	CalendarDayView - BackboneView
	 * 	@desc	view for one specific day
	 */
	var CalendarDayView = Backbone.View.extend({

		initialize: function(){
			this.template = rendertmpl('calendar_day');
			this.listenTo(this.collection, "timeSlotsReady", this.render);
		},

		render: function(){
			console.log(this.collection);
			this.$el.html(this.template({CourseSlots: this.collection, moment: moment}));
			this.$el.trigger("create");
			return this;
		}
	});


	/**
	 *	CalendarPageView - BackboneView
	 * 	Main View fpr calendar
	 */
	app.views.CalendarPage = utils.GesturesView.extend({

		attributes: {"id": "calendar"},

		events: {
			'swipeleft': 'navigateForward',
			'swiperight': 'navigateBackward',
			'click #export': 'exportToCalendar'
		},

		initialize: function(vars){
			// get passed day parameter and init collections
			this.day = vars.day ? moment(vars.day) : undefined;
			// check for valid date otherwise use current day
			if (!this.day || !this.day.isValid()){
				this.day = moment();
			}
			// remove time component, leave date
			this.day.set({
				"hour": 0,
				"minute": 0,
				"second": 0,
				"millisecond": 0
			});

			// TODO remove global variable (used in calendar_day.tmpl)
			day = this.day;

			//check if response request present
			this.CourseList = new calendar.CourseList();

			this.listenTo(this.CourseList, "error", this.errorHandler);

			this.listenToOnce(this, "prepareCourses", this.loadData);
			this.listenTo(this, 'errorHandler', this.errorHandler);

			this.template = rendertmpl('calendar');
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

		loadData: function() {
			if (this.loadingView) this.loadingView.empty();
			if (this.errorView) this.errorView.empty();

			var courseSlots = new calendar.CourseSlots(undefined, { courseList: this.CourseList, day: this.day });

			this.loadingView = new utils.LoadingView({collection: this.CourseList, el: this.$("#loadingSpinner")});
			new CalendarDayView({collection: courseSlots, el: this.$("#coursesForDay")});
			this.listenTo(courseSlots, "coursesEmpty", this.coursesEmpty);

			console.log('load data');

			this.CourseList.fetch(utils.cacheDefaults());
		},

		errorHandler: function(error){
			this.errorView = new utils.ErrorView({
				el: this.$('#coursesForDay'),
				msg: 'Der PULS-Dienst ist momentan nicht erreichbar.',
				module: 'calendar',
				err: error,
				hasReload: true
			}).on("reload", this.loadData, this);
		},

		coursesEmpty: function() {
			this.errorView = new utils.ErrorView({
				el: this.$('#coursesForDay'),
				msg: 'Keine Kurse gefunden.',
				module: 'calendar',
				hasReload: true
			}).on("reload", this.loadData, this);
		},

		render: function(){
			this.$el.html(this.template({day: this.day, moment: moment}));
			this.$el.trigger("create");
			this.trigger("prepareCourses");
			return this;
		}
	});

	return app.views.CalendarPage;
});