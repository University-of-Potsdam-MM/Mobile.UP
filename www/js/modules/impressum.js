define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var ImpressumPageView = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = utils.rendertmpl('impressum');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return ImpressumPageView;
});