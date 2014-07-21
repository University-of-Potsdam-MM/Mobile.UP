define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

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
			var result = "http://fossa.soft.cs.uni-potsdam.de:8280/services/pulsAPI?action=vvz";
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
			this.items.fetch({reset: true});
		}
	});

	VvzCollection = Backbone.Collection.extend({
		model: VvzItem,

		parse: function(response) {
			var categories = _.map(response.listitem.subitems.listitem, function(model) {
				model.isCategory = true;
				return model;
			});
			
			var courses = _.map(response.listitem.subitems.course, function(model) {
				model.isCourse = true;
				return model;
			});
			
			return _.union(categories, courses);
		}
	});

	var currentVvz = new CurrentVvz;

	var LectureNodeView = Backbone.View.extend({

		events: {
			"click": "loadChildren"
		},

		initialize: function() {
			this.template = utils.rendertmpl('lectures_items');
		},

		render: function() {
			var html = this.template({model: this.model});

			this.undelegateEvents();
			this.$el = $(html);
			this.delegateEvents();

			return this;
		},

		loadChildren: function(ev) {
			console.log("Lade " + this.model.get("suburl"));
			vvzHistory.openVvz(this.model);
		}
	});
	
	var LectureCourseView = Backbone.View.extend({

		events: {
			"click": "loadChildren"
		},

		initialize: function() {
			this.template = utils.rendertmpl('lectures_courses');
		},

		render: function() {
			var html = this.template({model: this.model});

			this.undelegateEvents();
			this.$el = $(html);
			this.delegateEvents();

			return this;
		},

		loadChildren: function() {
			console.log("Lade " + this.model.get("suburl"));

			// Create model
			var toLoad = new Backbone.Model;
			toLoad.url = this.model.get("suburl");
			toLoad.parse = function(response) { return response.course; };

			// Create view
			new LectureSingleCourseView({model: toLoad, el: $("#lectureCourse")});

			// Fetch from server
			toLoad.fetch();
		}
	});
	
	var LectureView = Backbone.View.extend({
		childView: undefined,
		childPredicate: undefined,

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

			this.$el.listview().listview("refresh");
			return this;
		}
	});

	var LectureNodesView = LectureView.extend({
		childView: LectureNodeView,
		childPredicate: function(model) { return model.get("isCategory"); }
	});
	
	var LectureCoursesView = LectureView.extend({
		childView: LectureCourseView,
		childPredicate: function(model) { return model.get("isCourse"); }
	});

	var LectureSingleCourseView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl('lectures_course');
			this.listenTo(this.model, "sync", this.render);
			this.listenTo(this.model, "error", this.requestFail);
		},
		
		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#lecturesHost', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'lectures', err: error});
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({model: this.model}));
			this.$el.trigger("create");

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

	var LecturesPageView = Backbone.View.extend({
		attributes: {"id": "lectures"},

		events: {
			"click #selectLevel-button": "selectMenu",
			"click #selectLevel-menu li": "selectLevel"
		},

		initialize: function(){
			this.template = utils.rendertmpl('lectures');
			this.listenToOnce(this, "render", this.prepareVvz);
			
			this.vvzHistory = vvzHistory;
			this.listenTo(vvzHistory, "vvzChange", function(vvzHistory) { currentVvz.load(vvzHistory); });
			this.listenTo(vvzHistory, "vvzChange", this.createPopupMenu);
			this.listenTo(vvzHistory, "vvzChange", this.triggerOpenVvzUrl);
			
			this.listenTo(currentVvz.items, "error", this.requestFail);
		},
		
		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#lecturesHost', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'lectures', err: error});
		},

		selectMenu: function(ev) {
			ev.preventDefault();
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
		},
		
		triggerOpenVvzUrl: function(vvzHistory) {
			this.trigger("openVvzUrl", vvzHistory);
		},
		
		createPopupMenu: function(history) {
			$('#selectLevel option').remove();
			history.each(function(option) {
				var node = $("<option>");
				node.attr("value", option.get("suburl"));
				node.text(option.get("name"));
				$('#selectLevel').prepend(node);
			});
			$('#selectLevel option').last().attr('selected', 'selected');
			$('#selectLevel').selectmenu('refresh', true);
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");

			this.trigger("render");

			return this;
		}
	});

	return LecturesPageView;
});

function asArray(subject) {
	 if (Array.isArray(subject)) {
		 return subject;
	 } else {
		 return [subject];
	 }
}
