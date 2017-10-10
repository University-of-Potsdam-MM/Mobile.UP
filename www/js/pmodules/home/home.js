define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/home");

	app.views.MainPage = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this, 'render');
		},

		render: function(){
			$(this.el).html('');
			return this;
		}
	});

	app.views.MainMenu = Backbone.View.extend({
		attributes: {"id": 'home'},

		initialize: function(p){
			this.page = p.page;
			this.template = rendertmpl('home');
			_.bindAll(this, 'render');
		},

		render: function(){
			this.$el = this.page;
			this.$el.attr('id', 'home');
			this.$el.html(this.template({}));
			this.$el.trigger("create");
			return this;
		}
	});

	app.views.MainLogout = Backbone.View.extend({

		initialize: function(p){
			this.template = utils.rendertmpl('logout');
			this.page = p.page;
			_.bindAll(this, 'render');
		},

		render: function(){
			this.$el = this.page;
			this.$el.attr('id', 'logout');
			this.$el.html(this.template({}));
			$.mobile.changePage.defaults.reverse = false;
			window.setTimeout(function(){$('.settings').hide();}, 100) //Logoutbutton oben rechts verstecken
			$('.back').attr('href', '#home');
			this.$el.trigger("create");
			return this;
		},
	});

});