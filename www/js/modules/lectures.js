define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	
	// Helping the eclipse JS Tools by declaring the variable here
	var VvzCollection = undefined;
	
	var VvzItem = Backbone.Model.extend({
		
		initialize: function() {
			this.subitems = new VvzCollection();
			this.subitems.url = this.createSubUrl();
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
		}
	});
	
	VvzCollection = Backbone.Collection.extend({
		model: VvzItem,
		
		parse: function(response) {
			return response.listitem.subitems.listitem;
		}
	});
	
	var items = new VvzItem().subitems;
	items.on("add", function(data) {
		// Do something with data
		console.log("VVZ-Daten geladen");
	});
	items.fetch();
	
	// Fetch all items at startup
	
	// Fetch subitems on request
	
	// Show individual vvz nodes
	var LectureNodeView = Backbone.View.extend({
		
		events: {
			"click": "loadChildren"
		},
		
		loadChildren: function() {
			this.trigger("loadChildren", this.model);
		}
	});
	
	var LectureNodesView = Backbone.View.extend({
		
		initialize: function() {
			this.template = utils.rendertmpl('lectures_items');
			this.listenTo(this.collection, "sync", this.render);
		},
		
		render: function() {
			this.$el.empty();
			this.$el.html(this.template({items: this.collection.models}));
			
			var that = this;
			this.$("li").each(function(index, element) {
				var model = that.collection.models[index];
				var view = new LectureNodeView({model: model, el: element});
				that.listenTo(view, "loadChildren", that.loadChildren);
			});
			
			this.$el.listview("refresh");
			return this;
		},
		
		loadChildren: function(model) {
			var items = model.subitems;
			
			new LectureNodesView({collection: items, el: this.$el});
			items.fetch();
		}
	});
	
	var LecturesPageView = Backbone.View.extend({
		attributes: {"id": "lectures"},

		initialize: function(){
			this.template = utils.rendertmpl('lectures');
			
			this.listenToOnce(this, "render", this.loadVvz);
		},
		
		loadVvz: function() {
			var items = new VvzItem().subitems;
			var host = this.$("#lectureCategoryList");
			
			new LectureNodesView({collection: items, el: host});
			items.fetch();
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