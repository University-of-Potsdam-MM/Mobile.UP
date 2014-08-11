// TODO: Logout Switch Missing

define([
		'jquery',
		'underscore',
		'backbone',
		'Session',
		'utils'
], function($, _, Backbone, Session, utils){

	var OptionsPageView = Backbone.View.extend({

		model: Session,
		attributes: {"id": 'options'},

		logintemplate: utils.rendertmpl('login'),
		logouttemplate: utils.rendertmpl('logout'),

		events: {
			'submit #loginform': 'login',
			'submit #logoutform': 'logout'
		},

		render: function(){

			if (this.model.get('up.session.authenticated')){
				$(this.el).html(this.logouttemplate({}));
			}else{
				$(this.el).html(this.logintemplate({}));
			}

			$(this.el).trigger("create");
			return this;
		},

		login: function(ev){
			ev.preventDefault();
			var username = $('#username').val();
			var password = $('#password').val();
			this.model.login({username: username, password: password});
		},

		logout: function(ev){
			ev.preventDefault();
			this.model.logout();
			this.render();
		}

	});

	return OptionsPageView;
});