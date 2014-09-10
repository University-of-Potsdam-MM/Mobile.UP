define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var classes = {};

	/*
	 *	Backbone Model - NewsEntry
	 */
	app.models.NewsEntry = Backbone.Model.extend({
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/view/',

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

	/*
	 *	Backbone Model - NewsListItem
	 *	can be Source or NewsEntry
	 */

	var NewsListItem = Backbone.Model.extend({

	});

	/*
	 *	Backbone Model - News
	 */
	app.models.News = Backbone.Collection.extend({
		model: app.models.NewsEntry,
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/',

		initialize: function(){
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
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/source/',

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
		el: '#news',
		inCollection : 'news.index.news', //controller.action.variable
		idInCollection : 'id', //name oder . getrennter Pfad, wo die id in der collection steht für ein objekt
		initialize: function(p){
			this.page  = p.page;
			this.template = utils.rendertmpl('news.view');
			_.bindAll(this, 'render');
			this.model = new app.models.NewsEntry(p);
			this.model.fetch({
				success: this.render,
				dataType: 'json' });
		},

		render:function(){
			this.$el = this.page.$el.find('#news');
			var vars = $.extend(this.model.toJSON(), this.p);
			if(!vars.news)
				vars.news = vars;
			this.$el.html(this.template(vars));
			this.$el.trigger("create");
			$('.back').click(function(e){window.history.back(); e.preventDefault(); e.stopPropagation();});
			return this;
		}
	});

	app.views.NewsSource = Backbone.View.extend({
		el: '#news',

		initialize: function(p){
			this.template = utils.rendertmpl('news_source');
			this.page  = p.page;
			_.bindAll(this, 'render');
			this.collection = new app.models.NewsSource(p);
			this.collection.fetch({
				success: this.render,
				dataType: 'json' });
		},

		render:function(){
			this.$el = this.page.$el.find('#news');
			this.$el.html(this.template({news: this.collection.toJSON()}));
			this.$el.trigger("create");
			$('.back').attr('href', '#news');
			return this;
		}
	});

	app.views.NewsSet_sources = Backbone.View.extend({
		el: '#news',

		initialize: function(p){
			this.template = utils.rendertmpl('news.set_sources');
			this.page  = p.page;
			_.bindAll(this, 'render');
			this.render();
		},

		render:function(){
			this.$el = this.page.$el.find('#news');
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
		el: '#news',

		initialize: function(p){
			this.template = utils.rendertmpl('news_index');
			_.bindAll(this, 'render');
			this.page  = p.page;
			this.collection = new app.models.News();
			this.collection.fetch({
				success: this.render,
				dataType: 'json' });
		},

		render: function(){
			app.data.newsSources = this.collection.response.newsSources;
			this.$el = this.page.$el.find('#news');
			this.$el.html(this.template({news: this.collection.toJSON(), disabledNews: utils.LocalStore.get('disabledNews', {})}));
			this.$el.trigger("create");
			return this;
		}

	});

	app.views.NewsPage = Backbone.View.extend({
		attributes: {"id": "news-container"},

		initialize: function(options){
			this.options = options || {};
			this.template = utils.rendertmpl('news');
		},

		render: function(){

			this.$el.html(this.template({}));
			//console.log(this.options.action);
			//console.log(this.options.aid);

			/*if (!this.options.action){
				var news = new app.models.News();
				var newsView = new NewsView({collection: news, el: $("#news-content", this.el)});
			} else {
				// handle page action
				if(this.options.action='view'){
					var newsEntry = new NewsEntry({id: this.options.aid});
					var newsEntryView = new NewsEntryView({model: newsEntry, el: $("#news-content", this.el)});
				}
			}*/

			this.$el.trigger("create");
			return this;
		},

		news: function(page, id){
			console.log(page);
			console.log(id);
		}
	});

	return app.views; //NewsPageView;
});