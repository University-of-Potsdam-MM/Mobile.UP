define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var LecturesPageView = Backbone.View.extend({
		attributes: {"id": "lectures"},

		initialize: function(){
			this.template = utils.rendertmpl('lectures');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return LecturesPageView;
});