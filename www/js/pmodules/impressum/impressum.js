define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
    'pmodules/impressum/impressum.models'
], function($, _, Backbone, utils, models){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/impressum");

	app.views.ImpressumPage = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = rendertmpl('impressum');
			this.model = new models.VersionModel;

			// The model cannot fail
			this.listenTo(this.model, "sync", this.render);
			this.model.fetch();
		},

		render: function(){
			this.$el.html(this.template({version: this.model.attributes}));
			this.$el.trigger("create");
			return this;
		}
	});

	return app.views.ImpressumPage;
});