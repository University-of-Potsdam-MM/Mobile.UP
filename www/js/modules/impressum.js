define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	app.views.ImpressumPage = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = utils.rendertmpl('impressum');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return app.views.ImpressumPage;
});