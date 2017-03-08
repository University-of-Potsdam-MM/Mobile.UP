define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'view.utils'
], function($, _, Backbone, utils, viewUtils) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/lectures");

	var LectureNodeView = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl('lectures_items');
		},

		render: function() {
			this.setElement(this.template({model: this.model}));
			this.$el.trigger("create");
			return this;
		}
	});

	var LectureCourseView = Backbone.View.extend({

		events: {
			"collapsibleexpand": "loadChildren"
		},

		initialize: function() {
			this.template = rendertmpl('lectures_courses');
			this.loadChildren = _.once(_.bind(this.loadChildren, this));
		},

		render: function() {
			this.setElement(this.template({model: this.model}));
			this.$el.trigger("create");
			return this;
		},

		loadChildren: function() {
			var submodel = this.model.createCourse();

            // Create view
            new LectureSingleCourseView({model: submodel, el: this.$("[data-role=listview]")});
            new utils.LoadingView({model: submodel, el: this.$(".loading-host")});

            // Fetch from server, cache for 2 hours
            submodel.fetch(utils.cacheDefaults({prefillExpires: 120 * 1000}));
		}
	});

	var EmptyListNotifier = Backbone.View.extend({

		runningCounter: 0,

		initialize: function() {
			this.listenTo(this.collection, "request", this.loadingOn);
			this.listenTo(this.collection, "cachesync", this.loadingHold);
			this.listenTo(this.collection, "sync", this.loadingOff);
			this.listenTo(this.collection, "error", this.loadingError);
		},

		loadingOn: function() {
			this.runningCounter++;
		},

		loadingHold: function(model, attr, opts) {
			if (opts.prefill) {
				this.runningCounter++;
			}
		},

		loadingOff: function() {
			this.runningCounter--;
			if (this.runningCounter <= 0) {
				this.render();
			}
		},

		loadingError: function() {
			this.runningCounter--;
		},

		render: function() {
			if (this.collection.isEmpty()) {
				this.$el.show();
			} else {
				this.$el.hide();
			}
		}
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
			this.$el.append(this.template({model: this.model}));
			this.$el.listview().listview("refresh");

			return this;
		}
	});

	app.views.LecturesCategory = Backbone.View.extend({

		initialize: function(options) {
			this.collection = options.currentNode;
			this.setElement(options.page.find("#lecturesHost"));
		},

		render: function() {
			if (this.collection.hasSubtree) {
                new viewUtils.ListView({
                    el: this.$("#lectureCategoryList"),
                    collection: this.collection,
                    view: LectureNodeView,
                    postRender: function () {
                        this.$el.listview().listview("refresh");
                    }
                }).render();
			} else {
                new viewUtils.ListView({
                    el: this.$("#lectureCourseList"),
                    collection: this.collection,
                    view: LectureCourseView,
                    postRender: function () {
                        this.$el.collapsibleset().collapsibleset("refresh");
                    }
                }).render();
			}

			// TODO: Move loading anchor and empty anchor down so that the lists are always on top
            new utils.LoadingView({collection: this.collection, el: this.$("#loadingSpinner")});
            new EmptyListNotifier({collection: this.collection, el: this.$("#emptyListNotifier")});

			return this;
		}
	});

    app.views.LecturesPage = Backbone.View.extend({
		attributes: {"id": "lectures"},

		events: {
			"click #selectLevel-button": "selectMenu",
			"click #selectLevel-menu li": "selectLevel"
		},

		initialize: function(options) {
			this.template = rendertmpl('lectures');
			this.vvzNavigation = options.vvzNavigation;

			_.bindAll(this, 'selectMenu', 'selectLevel');
		},

		selectMenu: function(ev) {
			ev.preventDefault();

			this.$('#selectLevel-listbox').popup({ theme: "b" });
			this.$('#selectLevel-listbox').popup("open");

			return true;
		},

		selectLevel: function(ev) {
			ev.preventDefault();

			var headerId = $('#selectLevel').find(":selected").attr("value");
			if (headerId !== "0") {
				var item = this.vvzNavigation.find(headerId);
                app.route("#lectures/lectures/" + item.headerId + "/" + item.hasSubtree + "/" + encodeURIComponent(item.name));
			} else {
				app.route("#lectures/lectures");
			}

			return true;
		},

		render: function() {
			this.$el.html(this.template({isRoot: this.vvzNavigation.hierarchy.length === 1, vvzHierarchy: this.vvzNavigation.hierarchy}));
			this.$el.trigger("create");
			this.$('#selectLevel-button').attr('href', '#');

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
