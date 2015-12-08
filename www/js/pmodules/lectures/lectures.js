define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/lectures");

	// Helping the eclipse JS Tools by declaring the variable here
	var VvzCollection = undefined;
	var VvzCourseCollection = undefined;

	var VvzItem = Backbone.Model.extend({
		defaults: {
			"name": "Vorlesungsverzeichnis"
		},

		initialize: function() {
			this.set("suburl", this.createSubUrl());
		},

		createSubUrl: function() {
			var result = "https://api.uni-potsdam.de/endpoints/pulsAPI/1.0?action=vvz";
			result += "&auth=H2LHXK5N9RDBXMB";
			result += this.getIfAvailable("url", "&url=");
			result += this.getIfAvailable("level", "&level=");
			return result;
		},

		getIfAvailable: function(attribute, pretext) {
			if (this.get(attribute)) {
				return pretext + encodeURIComponent(this.get(attribute));
			} else {
				return "";
			}
		}
	});

	var CurrentVvz = Backbone.Model.extend({

		initialize: function() {
			this.items = new VvzCollection();
		},

		load: function(vvzHistory) {
			var vvzUrl = vvzHistory.first().get("suburl")

			this.items.url = vvzUrl;
			this.items.reset();
			this.items.fetch(utils.cacheDefaults({reset: true}));
		}
	});

	VvzCollection = Backbone.Collection.extend({
		model: VvzItem,

		parse: function(response) {
			var rawCategories = this.ensureArray(response.listitem.subitems.listitem);
			var categories = _.map(rawCategories, function(model) {
				model.isCategory = true;
				return model;
			});

			var rawCourses = this.ensureArray(response.listitem.subitems.course);
			var courses = _.map(rawCourses, function(model) {
				model.isCourse = true;
				return model;
			});

			return _.union(categories, courses);
		},

		ensureArray: function(param) {
			if (!param) {
				return param;
			} else if (Array.isArray(param)) {
				return param;
			} else {
				return [param];
			}
		}
	});

	var currentVvz = new CurrentVvz;

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
			//console.log("loadChildren ausgelöst");

			var submodel = this.model.get("submodel");
			if (!submodel) {
				// Create model
				submodel = new Backbone.Model;
				submodel.url = this.model.get("suburl");
				submodel.parse = function(response) { return response.course; };
				this.model.set("submodel", submodel);

				// Create view
				new LectureSingleCourseView({model: submodel, el: this.$("[data-role=listview]")});
				new utils.LoadingView({model: submodel, el: this.$(".loading-host")});

				// Fetch from server
				submodel.fetch(utils.cacheDefaults());
			}
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

	var VvzHistory = Backbone.Collection.extend({

		initialize: function() {
			this.listenTo(this, "add", this.triggerVvzChange);
			this.listenTo(this, "reset", this.triggerVvzChange);
		},

		openVvz: function(vvzItem) {
			var current = vvzItem.pick("name", "suburl");
			this.add(current, {at: 0});
		},

		resetToUrl: function(modelUrl) {
			var model = this.find(function(element) { return element.get("suburl") == modelUrl; });
			var remainingModels = this.last(this.length - this.indexOf(model));

			this.reset(remainingModels);
		},

		triggerVvzChange: function() {
			if (this.isEmpty()) {
				// Triggers a new function call
				this.add(new VvzItem());
			} else {
				this.trigger("vvzChange", this);
			}
		}
	});

	var vvzHistory = new VvzHistory;

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
			this.listenTo(vvzHistory, "vvzChange", this.triggerOpenVvzUrl);

			this.listenTo(currentVvz.items, "error", this.requestFail);
			
			_.bindAll(this, 'render', 'requestFail', 'selectMenu', 'selectLevel', 'prepareVvz', 'triggerOpenVvzUrl', 'createPopupMenu');
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

		triggerOpenVvzUrl: function(vvzHistory) {
			this.trigger("openVvzUrl", vvzHistory);
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

function asArray(subject) {
	 if (Array.isArray(subject)) {
		 return subject;
	 } else {
		 return [subject];
	 }
}
