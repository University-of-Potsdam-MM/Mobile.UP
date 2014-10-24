define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var StudyPageView = Backbone.View.extend({

		initialize: function(){
			this.template = utils.rendertmpl('study');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return StudyPageView;
});