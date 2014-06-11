define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var GradesPageView = Backbone.View.extend({
		attributes: {"id": "grades"},

		initialize: function(){
			this.template = utils.rendertmpl('grades');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return GradesPageView;
});