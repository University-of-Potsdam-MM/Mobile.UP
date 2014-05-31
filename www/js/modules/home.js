define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var HomePageView = Backbone.View.extend({
		attributes: {"id": 'home'},

		initialize: function(){
			this.template = utils.rendertmpl('home');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return HomePageView;
});