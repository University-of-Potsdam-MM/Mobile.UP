define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var EventsPageView = Backbone.View.extend({
		attributes: {"id": 'events'},

		initialize: function(){
			this.template = utils.rendertmpl('events');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return EventsPageView;
});