define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'Session'
], function($, _, Backbone, utils, Session) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/reflectup");

	var AppModel = Backbone.Model.extend({
		defaults: {
			iosStoreUrl : 'https://itunes.apple.com/de/app/reflect-up/id930109466?mt=8',
			androidStoreUrl: 'https://play.google.com/store/apps/details?id=de.unipotsdam.reflectup&hl=de'
		}
	});

	app.views.ReflectupPage = Backbone.View.extend({
		render: function(){
			this.$el.html('');
			return this;
		}
	});

	app.views.ReflectupIndex = Backbone.View.extend({
		attributes: {"id": 'reflectup'},
		model: AppModel,

		initialize: function(p){
			this.page = p.page;
			this.template = rendertmpl('reflectup');
			this.model = new AppModel();
			this.listenToOnce(this, "afterRender", this.startAppLaunch);
		},

		startAppLaunch: function() {
			/*
			 *	handlers for trying to app launch
			 */
			var appCanLaunchSuccessCallback = _.bind(function(data){
				// try to launch app
				app.route("main/menu", false, true);
				window.plugins.launcher.launch({uri:'reflectup://', flags: window.plugins.launcher.FLAG_ACTIVITY_NEW_TASK}, appLaunchSuccessCallback, appLaunchErrorCallback);
			}, this);

			var appCanLaunchErrorCallback = _.bind(function(errMsg){
				// app not installed try to open app store
				this.$el.find(".reflectup-message").hide();
				this.$el.find(".reflectup-appstore").show();
				this.launchAppStore();
			}, this);

			/*
			 *	handlers for app launching
			 */
			var appLaunchSuccessCallback = _.bind(function(data){
				this.$el.find(".reflectup-message").hide();
				this.$el.find(".reflectup-appstore").show();
			}, this);

			var appLaunchErrorCallback = _.bind(function(errMsg){
				this.$el.find(".reflectup-message").hide();
				this.$el.find(".reflectup-appstore").show();
				this.launchAppStore();
			}, this);

			window.plugins.launcher.launch({uri:'reflectup://', flags: window.plugins.launcher.FLAG_ACTIVITY_NEW_TASK}, appLaunchSuccessCallback, appLaunchErrorCallback);
		},

		launchAppStore: function(){
			if (device.platform == "Android"){
				window.open(this.model.get('androidStoreUrl'), "_system");
			}else if(device.platform == "iOS"){
				window.open(this.model.get('iosStoreUrl'), "_system");
			}
		},

		render: function(){
			this.$el = this.page;
			this.$el.attr('id', 'reflectup');
			this.$el.html(this.template({model: this.model}));
			this.$el.trigger("create");

			this.trigger("afterRender");
			return this;
		}
	});

	return app.views;
});