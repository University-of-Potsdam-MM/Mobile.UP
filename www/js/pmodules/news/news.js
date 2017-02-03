define(['jquery', 'underscore', 'backbone', 'utils', 'viewContainer'], function($, _, Backbone, utils, viewContainer){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/news");

	var server = 'https://api.uni-potsdam.de/endpoints/newsAPI';

	var classes = {};

	var newsSources = {};

	/*
	 *	Backbone Model - NewsEntry
	 */
	app.models.NewsEntry = Backbone.Model.extend({
		url: function() {
			return server + '/json/news/view/' + this.id;
		},

		parse: function(response){
			//console.log(response);
			if(response.vars)
				response = response.vars;

			// Add the ID if it exists
			return _.extend(response, response.News ? {id: response.News.id} : {});
		}
	});

	/**
	 *	Backbone Model - NewsListItem
	 *	can be Source or NewsEntry
	 */

	var NewsListItem = Backbone.Model.extend({

	});

	/**
	 *	Backbone Model - News
	 */
	app.models.News = Backbone.Collection.extend({
		model: app.models.NewsEntry,
		url: server + '/json/news/',

		initialize: function() {
			utils.cacheModelsOnSync(this, this.cacheModels);
		},

		cacheModels: function(cache) {
			cache.response = this.response.news[cache.index];
		},

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.news;
		},
	});

	app.models.NewsSource = Backbone.Collection.extend({
		model: app.models.NewsEntry,
		url: server + '/json/news/source/',

		initialize: function(p){
			this.url = this.url+p.id;
		},

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.news;
		},
	});


	var NewsSource = Backbone.Collection.extend({
		model: app.models.News
	})

	app.views.NewsView = Backbone.View.extend({

		initialize: function(p){
			this.page  = p.page;
			this.template = rendertmpl('news_view');
			_.bindAll(this, 'render');
			this.model = new app.models.NewsEntry(p);

			this.model.p = p;
			this.listenToOnce(this.model, "sync", this.render);
			this.listenToOnce(this.model, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.model.fetch({cache: true, expires: 60*60});
		},

		render:function(){
			// No data? No view!
			if (!this.model.has("News") && !this.model.has("news")) {
				return this;
			}

			this.$el = this.page.find('#news');
			var vars = $.extend(this.model.toJSON(), this.p);
			if(!vars.news)
				vars.news = vars;
			this.$el.html(this.template(vars));
			this.$el.trigger("create");
			//$('.back').click(function(e){window.history.back(); e.preventDefault(); e.stopPropagation();});
			$('.back').attr('href', '#news');
			return this;
		}
	});

	app.views.NewsSource = Backbone.View.extend({

		initialize: function(p){
			this.template = rendertmpl('news_source');
			_.bindAll(this, 'render');
			this.collection = new app.models.NewsSource(p);

			utils.removeNonExpiringElements(this.collection);

			this.collection.p = p;
			this.listenToOnce(this.collection, "sync", this.render);
			this.listenToOnce(this.collection, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.collection.fetch({cache: true, expires: 60*60});
		},

		render:function(){
			// No data? No view!
			if (!this.collection.response) {
				return this;
			}

			this.$el = this.page.find('#news');
			this.$el.html(this.template({news: this.collection.toJSON()}));
			this.$el.trigger("create");
			$.mobile.changePage.defaults.reverse = true;
			$('.back').attr('href', '#news');
			return this;
		}
	});

	app.views.NewsSet_sources = Backbone.View.extend({

		initialize: function(p){
			this.template = rendertmpl('news_set_sources');
			_.bindAll(this, 'render', 'toggleNews');
		},

		render:function(){
			this.$el = this.page.find('#news');
			//console.log(utils.LocalStore.get('disabledNews', {}));
			this.$el.html(this.template({newsSources: newsSources, disabledNews: utils.LocalStore.get('disabledNews', {})}));
			$('.ch-news').change(this.toggleNews);
			this.$el.trigger("create");
			$('.back').attr('href', '#news');
			return this;
		},
		/*
		* Newsquellen toggeln
		* @it: getoggelte Checkbox
		*/
		toggleNews:function(){
			var elements = $('#newslist').find('.ch-news');
			var self = this;
			var disabledNews = {};
			elements.each(function(i, el) {
				if(!el.checked)
					disabledNews[$(el).data('id')] = 1;
			});
			//console.log(disabledNews);
			utils.LocalStore.set('disabledNews', disabledNews);
		},
	});

	app.views.NewsIndex = Backbone.View.extend({

		initialize: function(p){
			this.template = rendertmpl('news_index');
			_.bindAll(this, 'render');
			this.page  = p.page;
			this.collection = new app.models.News();

			utils.removeNonExpiringElements(this.collection);

			this.collection.p = p;
			this.listenToOnce(this.collection, "sync", this.render);
			this.listenToOnce(this.collection, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.collection.fetch({cache: true, expires: 60*60, success: p.fetchCallback});
		},

		render: function(){
			// No data? No view!
			if (!this.collection.response) {
				return this;
			}

			newsSources = this.collection.response.newsSources;
			this.$el = this.page.find('#news');
			this.$el.html(this.template({news: this.collection.toJSON(), disabledNews: utils.LocalStore.get('disabledNews', {})}));
			this.$el.trigger("create");
			$.mobile.changePage.defaults.reverse = false;
			$('.back').attr('href', '#home');
			return this;
		}

	});

	app.views.NewsPage = Backbone.View.extend({

		attributes: {"id": 'news'},

		initialize: function(){
			this.template = rendertmpl('news');
		},

		render: function(){
			var $el = $(this.el);
			$el.html(this.template({}));
			$el.trigger("create");
			return this;
		}
	});

	return app.views;
});