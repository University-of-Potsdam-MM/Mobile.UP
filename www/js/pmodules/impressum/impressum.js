define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/impressum");

	app.views.ImpressumPage = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = rendertmpl('impressum');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return app.views.ImpressumPage;
});