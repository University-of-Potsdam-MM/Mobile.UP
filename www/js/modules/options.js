// TODO: Logout Switch Missing

define([
		'jquery',
		'underscore',
		'backbone',
		'Session',
		'utils'
], function($, _, Backbone, Session, utils){

	var OptionsPageView = Backbone.View.extend({

		attributes: {"id": 'options'},
		template: utils.rendertmpl('options'),

		events: {
			'submit form': 'submit'
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		},

		submit: function(ev){
			ev.preventDefault();
			var username = $('#username').val();
			var password = $('#password').val();
			Session.login({username: username, password: password});
		}

	});

	return OptionsPageView;
});