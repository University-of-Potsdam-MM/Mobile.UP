define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/tipps");

	//Models--------------------------------------
	//model for tipp items
	var Tipp = Backbone.Model.extend({
	});

	// collection for tipp items
	var Tipps = Backbone.Collection.extend({
		model: Tipp,
		url: 'https://api.uni-potsdam.de/endpoints/staticContent/1.0/tipps.json',
		comparator: 'name'
	});

	//Views-------------------------------------------
	// view for single tipp in overview
	var TippView = Backbone.View.extend({

		initialize: function(){
			_.bindAll(this, 'render');
			this.template = rendertmpl('tipp');
		},

		render: function(){
			this.$el.html(this.template({tipp: this.model.toJSON()}));
			return this;
		}
	});

	// view for several tipps (list) in overview
	var TippListView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.collection = new Tipps();
			this.collection.fetch({
				cache: true,
				expires: 60 * 60 * 24, // Fetch once per day
				success: this.fetchSuccess,
				error: this.fetchError
			});
			this.render();
		},

		fetchSuccess: function() {
			this.render();
		},

		fetchError: function() {
			throw new Error('Error loading JSON file');
		},

		render: function(){
			this.collection.each(function(model){
				var tippView = new TippView({model: model});
				this.$el.append(tippView.render().$el.html());
			}, this);

			this.$el.trigger("create");
			return this;
		}
	});

	// root-view for overview (notwendig weil header nicht mehrmals gerendert werden darf!)
	app.views.TippIndex = Backbone.View.extend({
		initialize: function() {
			this.template = rendertmpl('tippOverview');
		},

		render: function() {
			this.$el = this.page;

			this.$el.html(this.template({}));
			var tippListView = new TippListView({el: this.$("#tipp-list")});
			this.$el.trigger("create");
			return this;
		}
	});


	// view for links to external pages
	var TippLink = Backbone.View.extend({

		initialize: function(options){
			_.bindAll(this, 'render');
			this.template = rendertmpl('tippLink');
			this.tipplink = options.tipplink;
			console.log(this.tipplink);
		},

		render: function(){
			this.$el.html(this.template({tipplink: this.tipplink}));
			return this;
		}
	});

	// ...
	var TippContentView = Backbone.View.extend({
		initialize: function(options) {
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.template = rendertmpl('tippContent');
			this.tippName = options.tippName;
			this.collection = new Tipps();
			this.collection.fetch({
				success: this.fetchSuccess,
				error: this.fetchError
			});
		},

		fetchSuccess: function() {
			this.render();
		},

		fetchError: function() {
			throw new Error('Error loading JSON file');
		},

		render: function() {
			var model = this.collection.findWhere({name: this.tippName});
			_.each(model.attributes.content, function(content){
				this.$el.append(this.template({content: content}));
				if(content.links){
					_.each(content.links, function(link){
						var tippLink = new TippLink({tipplink: link});
						// console.log(tippLink.render().$el.html());
						this.$('#'+content.anchor+'-links').append(tippLink.render().$el.html());
					}, this);
				}
			}, this);

			this.$el.trigger("create");
			return this;
			// .....................................<<-
		}
	});

	// root-view for detailview
	app.views.TippDetail = Backbone.View.extend({
		initialize: function(options){
			this.tippName = options.tippName;
			this.template = rendertmpl('tippDetailview');
		},

		render: function(){
			this.$el = this.page;

			this.$el.html(this.template({name: this.tippName}));
			var tippContentView = new TippContentView({el: this.$("#tipp-content"), tippName: this.tippName});
			this.$el.trigger("create");
			return this;
		}
	});


	return app.views;
});