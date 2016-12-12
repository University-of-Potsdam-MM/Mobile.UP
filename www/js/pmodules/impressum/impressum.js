define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/impressum");

	var VersionModel = Backbone.Model.extend({

		fetch: function(options) {
			var result = $.Deferred();

			var that = this;
			var finalize = function(vNumber, vCode) {
				var data = {
					"versionNumber": vNumber,
					"versionCode": vCode
				};
				that.set(data);
				result.resolve(data, null, result);
				that.trigger("sync", that, data, options);
			};

			if (window.cordova) {
				window.cordova.getAppVersion.getVersionNumber(function(vNumber) {
					window.cordova.getAppVersion.getVersionCode(function(vCode) {
						finalize(vNumber, vCode);
					});
				});
			} else {
				finalize("N/A", "N/A");
			}

			return result.promise();
		}
	});

	app.views.ImpressumPage = Backbone.View.extend({
		attributes: {"id": "impressum"},

		initialize: function(){
			this.template = rendertmpl('impressum');
			this.model = new VersionModel;

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