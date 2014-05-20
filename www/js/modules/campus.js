define([],function(){
	var CampusPageView = Backbone.View.extend({

		initialize: function(){
			this.template = rendertmpl('campus');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return CampusPageView;
});