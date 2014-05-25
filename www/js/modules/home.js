define(['jquery', 'underscore', 'backbone', 'helper'], function($, _, Backbone, helper){

	var HomePageView = Backbone.View.extend({
		attributes: {"id": 'home'},

		initialize: function(){
			this.template = helper.rendertmpl('home');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return HomePageView;
});