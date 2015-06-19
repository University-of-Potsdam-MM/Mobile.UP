define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var classes = {};

	/*
	 *	Backbone Model - NewsEntry
	 */
	app.models.NewsEntry = Backbone.Model.extend({
		url: 'https://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/view/',

		initialize: function(){
			this.url = this.url+this.id;
		},

		parse: function(response){
			//console.log(response);
			if(response.vars)
				response = response.vars;
			return response;
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
		url: 'https://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/',

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.news;
		},
	});

	app.models.NewsSource = Backbone.Collection.extend({
		model: app.models.NewsEntry,
		url: 'https://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/source/',

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
		inCollection : 'news.index.news', //controller.action.variable
		idInCollection : 'id', //name oder . getrennter Pfad, wo die id in der collection steht für ein objekt
		initialize: function(p){
			this.page  = p.page;
			this.template = utils.rendertmpl('news_view');
			_.bindAll(this, 'render');
			this.model = new app.models.NewsEntry(p);
		},

		render:function(){
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
			this.template = utils.rendertmpl('news_source');
			_.bindAll(this, 'render');
			this.collection = new app.models.NewsSource(p);
		},

		render:function(){
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
			this.template = utils.rendertmpl('news_set_sources');
			_.bindAll(this, 'render', 'toggleNews');
		},

		render:function(){
			this.$el = this.page.find('#news');
			//console.log(utils.LocalStore.get('disabledNews', {}));
			this.$el.html(this.template({newsSources: app.data.newsSources, disabledNews: utils.LocalStore.get('disabledNews', {})}));
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
					disabledNews[$(el).data('id')] = $(el).data('id');
			});
			//console.log(disabledNews);
			utils.LocalStore.set('disabledNews', disabledNews);
		},
	});

	app.views.NewsIndex = Backbone.View.extend({

		initialize: function(p){
			this.template = utils.rendertmpl('news_index');
			_.bindAll(this, 'render');
			this.page  = p.page;
			this.collection = new app.models.News();
		},

		render: function(){
			app.data.newsSources = this.collection.response.newsSources;
			this.$el = this.page.find('#news');
			this.$el.html(this.template({news: this.collection.toJSON(), disabledNews: utils.LocalStore.get('disabledNews', {})}));
			this.$el.trigger("create");
			$.mobile.changePage.defaults.reverse = false;
			$('.back').attr('href', '#home');
			return this;
		}

	});

	app.views.NewsPage = Backbone.View.extend({
		
		initialize: function(){
			this.template = utils.rendertmpl('news');
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
