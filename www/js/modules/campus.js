define(['jquery', 'underscore', 'backbone', 'helper'], function($, _, Backbone, helper){

	var CampusPageView = Backbone.View.extend({
		attributes: {"id": "campus"},

		initialize: function(){
			this.template = helper.rendertmpl('campus');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return CampusPageView;
});