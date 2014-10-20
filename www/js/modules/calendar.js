define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var CalendarPageView = Backbone.View.extend({

		initialize: function(){
			this.template = utils.rendertmpl('calendar');
		},

		render: function(){
			this.$el.html(this.template({}));
			return this;
		}
	});

	return CalendarPageView;
});