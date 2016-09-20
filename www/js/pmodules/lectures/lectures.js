define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'pmodules/lectures/lectures.models'
], function($, _, Backbone, utils, lectures){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/lectures");

	var currentVvz = new lectures.CurrentVvz;

	var LectureNodeView = Backbone.View.extend({

		events: {
			"click": "loadChildren"
		},

		initialize: function() {
			this.template = rendertmpl('lectures_items');
		},

		render: function() {
			var html = this.template({model: this.model});

			this.undelegateEvents();
			this.$el = $(html);
			this.delegateEvents();

			return this;
		},

		loadChildren: function(ev) {
			ev.preventDefault();
			
			console.log("Lade " + this.model.get("suburl"));
			vvzHistory.openVvz(this.model);
		}
	});

	var LectureCourseView = Backbone.View.extend({

		events: {
			"collapsibleexpand": "loadChildren"
		},

		initialize: function() {
			this.template = rendertmpl('lectures_courses');
		},

		render: function() {
			var html = this.template({model: this.model});

			this.undelegateEvents();
			this.$el = $(html);
			this.delegateEvents();

			return this;
		},

		loadChildren: function() {
			this.model.ensureSubmodelLoaded(_.bind(function(submodel) {
				// Create view
				new LectureSingleCourseView({model: submodel, el: this.$("[data-role=listview]")});
				new utils.LoadingView({model: submodel, el: this.$(".loading-host")});

				// Fetch from server
				submodel.fetch(utils.cacheDefaults());
			}, this));
		}
	});

	var LectureView = Backbone.View.extend({
		childView: undefined,
		childPredicate: undefined,
		renderPostAction: undefined,

		initialize: function() {
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function() {
			this.$el.empty();

			var that = this;
			var children = this.collection.filter(this.childPredicate);
			_.each(children, function(model) {
				var view = new that.childView({model: model});
				that.$el.append(view.render().$el);
			});

			this.renderPostAction();
			return this;
		}
	});

	var LectureNodesView = LectureView.extend({
		childView: LectureNodeView,
		childPredicate: function(model) { return model.get("isCategory"); },
		renderPostAction: function() { this.$el.listview().listview("refresh"); }
	});

	var LectureCoursesView = LectureView.extend({
		childView: LectureCourseView,
		childPredicate: function(model) { return model.get("isCourse"); },
		renderPostAction: function() { this.$el.collapsibleset().collapsibleset("refresh"); }
	});

	var LectureSingleCourseView = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl('lectures_course');
			this.listenTo(this.model, "sync", this.render);
			this.listenTo(this.model, "error", this.requestFail);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#lecturesHost', msg: 'Zurzeit nicht verfügbar.', module: 'lectures', err: error});
		},

		render: function() {
			//console.log("sync ausgelöst");
			this.$el.append(this.template({model: this.model}));
			this.$el.listview().listview("refresh");

			return this;
		}
	});

	var vvzHistory = new lectures.VvzHistory;

	app.views.LecturesPage = Backbone.View.extend({
		attributes: {"id": "lectures"},

		events: {
			"click #selectLevel-button": "selectMenu",
			"click #selectLevel-menu li": "selectLevel"
		},

		initialize: function(){
			this.template = rendertmpl('lectures');
			this.listenToOnce(this, "render", this.prepareVvz);

			this.vvzHistory = vvzHistory;
			this.listenTo(vvzHistory, "vvzChange", function(vvzHistory) { currentVvz.load(vvzHistory); });
			this.listenTo(vvzHistory, "vvzChange", this.createPopupMenu);

			this.listenTo(currentVvz.items, "error", this.requestFail);
			
			_.bindAll(this, 'render', 'requestFail', 'selectMenu', 'selectLevel', 'prepareVvz', 'createPopupMenu');
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#lecturesHost', msg: 'Zurzeit nicht verfügbar.', module: 'lectures', err: error});
		},

		selectMenu: function(ev) {
			ev.preventDefault();
			$('#selectLevel-listbox').popup({ theme: "b" });
			$('#selectLevel-listbox').popup("open");
		},

		selectLevel: function(ev) {
			ev.preventDefault();
			var selectedUrl = $('#selectLevel').find(":selected").attr("value");
			vvzHistory.resetToUrl(selectedUrl);
		},

		/**
		 * Initializes the views for the lecture course lists. This function may only be called after rendering the template because the views depend on anchors that are defined within the template.
		 */
		prepareVvz: function() {
			new LectureNodesView({collection: currentVvz.items, el: this.$("#lectureCategoryList")});
			new LectureCoursesView({collection: currentVvz.items, el: this.$("#lectureCourseList")});
			new utils.LoadingView({collection: currentVvz.items, el: this.$("#loadingSpinner")});
		},

		createPopupMenu: function(history) {
			var level = this.$("#selectLevel");

			level.find('option').remove();
			history.each(function(option) {
				var node = $("<option>");
				node.attr("value", option.get("suburl"));
				node.text(option.get("name"));
				level.prepend(node);
			});
			level.find('option').last().attr('selected', 'selected');
			level.selectmenu().selectmenu('refresh', true);
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");

			this.trigger("render");
			$('#selectLevel-button').attr('href', '#');
			return this;
		}
	});

	return app.views.LecturesPage;
});

// Used in lectures_course.tmpl
function asArray(subject) {
	 if (Array.isArray(subject)) {
		 return subject;
	 } else {
		 return [subject];
	 }
}
