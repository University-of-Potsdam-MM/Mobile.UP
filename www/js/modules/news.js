define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var NewsPageView = Backbone.View.extend({
		attributes: {"id": 'news'},

		initialize: function(){
			this.template = utils.rendertmpl('news');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return NewsPageView;
});