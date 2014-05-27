define(['jquery', 'underscore', 'backbone', 'helper'], function($, _, Backbone, helper){
	var StudyPageView = Backbone.View.extend({

		initialize: function(){
			this.template = helper.rendertmpl('study');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return StudyPageView;
});