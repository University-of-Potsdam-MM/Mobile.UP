define([],function(){
	var StudyPageView = Backbone.View.extend({

		initialize: function(){
			this.template = rendertmpl('study');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return StudyPageView;
});