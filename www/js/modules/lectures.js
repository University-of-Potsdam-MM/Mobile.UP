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

			if (this.get("url")) {
				result += "&url=" + encodeURIComponent(this.get("url"));
			}

			if (this.get("level")) {
				result += "&level=" + this.get("level");
			}

			return result;
		},

		/**
		 *
		 * @param context should be a CurrentVvz
		 */
		loadIn: function(context) {
			context.subitems.url = this.get("suburl");
			context.subitems.fetch({reset: true});

			context.courses.url = this.get("suburl");
			context.courses.fetch({reset: true});
		}
	});

	var CurrentVvz = Backbone.Model.extend({

		initialize: function() {
			this.subitems = new VvzCollection();
			this.courses = new VvzCourseCollection();
		}
	});

	VvzCollection = Backbone.Collection.extend({
		model: VvzItem,

		parse: function(response) {
			return response.listitem.subitems.listitem;
		}
	});

	VvzCourseCollection = Backbone.Collection.extend({
		model: VvzItem,

		parse: function(response) {
			return response.listitem.subitems.course;
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
			this.trigger("openVvzUrl", this.model);
		}
	});

	var LectureNodesView = Backbone.View.extend({

		initialize: function() {
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function() {
			this.$el.empty();

			var that = this;
			this.collection.each(function(model) {
				var view = new LectureNodeView({model: model});
				that.$el.append(view.render().$el);
				that.listenTo(view, "openVvzUrl", function(model) { this.trigger("openVvzUrl", model); });
			});

			this.$el.listview().listview("refresh");
			return this;
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

	var LectureCoursesView = Backbone.View.extend({

		initialize: function() {
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function() {
			this.$el.empty();

			var that = this;
			this.collection.each(function(model) {
				var view = new LectureCourseView({model: model});
				that.$el.append(view.render().$el);
			});

			this.$el.listview().listview("refresh");
			return this;
		}
	});

	var LectureSingleCourseView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl('lectures_course');
			this.listenTo(this.model, "sync", this.render);
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({model: this.model}));
			this.$el.trigger("create");

			return this;
		}
	});

	var LecturesPageView = Backbone.View.extend({
		attributes: {"id": "lectures"},

		events: {
			"click #selectLevel-button": "selectMenu",
			"click #selectLevel-menu li": "selectLevel"
		},

		initialize: function(){
			this.template = utils.rendertmpl('lectures');
			this.listenToOnce(this, "render", this.prepareVvz);
			
			this.vvzHistory = new Backbone.Collection;
			this.listenTo(this.vvzHistory, "reset", this.openVvzUrl);
			this.listenTo(this.vvzHistory, "add", this.openVvzUrl);
		},

		selectMenu: function(ev) {
			ev.preventDefault();
			$('#selectLevel-listbox').popup("open");
		},

		selectLevel: function(ev) {
			ev.preventDefault();
			var selectedUrl = $('#selectLevel').find(":selected").attr("value");
			var selectedModel = this.vvzHistory.find(function(element) { return element.get("suburl") == selectedUrl; });
			var remainingModels = this.vvzHistory.last(this.vvzHistory.length - this.vvzHistory.indexOf(selectedModel));
			
			this.vvzHistory.reset(remainingModels);
		},

		prepareVvz: function() {
			var items = currentVvz.subitems;
			var host = this.$("#lectureCategoryList");

			var lnv = new LectureNodesView({collection: items, el: host});
			this.listenTo(lnv, "openVvzUrl", this.proxyOpenVvzUrl);
			
			new LectureCoursesView({collection: currentVvz.courses, el: this.$("#lectureCourseList")});
		},
		
		proxyOpenVvzUrl: function(vvzItem) {
			var current = vvzItem.pick("name", "suburl");
			this.vvzHistory.add(current, {at: 0});
		},
		
		openVvzUrl: function() {
			if (this.vvzHistory.isEmpty()) {
				this.vvzHistory.add(new VvzItem());
				return;
			}
			var vvzUrl = this.vvzHistory.first().get("suburl");
			
			this.createPopupMenu(this.vvzHistory);
			
			var context = currentVvz;
			
			context.subitems.url = vvzUrl;
			context.subitems.fetch({reset: true});
			
			context.courses.url = vvzUrl;
			context.courses.fetch({reset: true});
			
			this.trigger("openVvzUrl", this.vvzHistory);
		},
		
		createPopupMenu: function(history) {
			$('#selectLevel option').remove();
			history.each(function(option) {
				var node = $("<option>");
				node.attr("value", option.get("suburl"));
				node.text(option.get("name"));
				//$('#selectLevel').prepend('<option value="'+option.get("name")+'">'+option.get("name")+'</option>');
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
