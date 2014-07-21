define(['jquery', 'underscore', 'backbone', 'helper'], function($, _, Backbone, helper){

	var ImpressumPageView = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = helper.rendertmpl('impressum');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return ImpressumPageView;
});