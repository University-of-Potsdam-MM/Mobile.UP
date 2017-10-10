define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'Session'
], function($, _, Backbone, utils, Session) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/reflectup");

	app.views.ReflectupPage = Backbone.View.extend({

		render: function(){
			this.$el.html('');
			return this;
		}
	});

	app.views.ReflectupIndex = Backbone.View.extend({
		attributes: {"id": 'reflectup'},

		initialize: function(p){
			console.log('in');
			this.page = p.page;
			this.template = rendertmpl('reflectup');

			this.listenToOnce(this, "afterRender", this.startAppLaunch);
		},

		startAppLaunch: function() {
			/*
			 *	handlers for trying to app launch
			 */
			var appCanLaunchSuccessCallback = _.bind(function(data){
				// try to launch app
				app.route("main/menu", false, true);
				window.plugins.launcher.launch({uri:'reflectup://'}, appLaunchSuccessCallback, appLaunchErrorCallback);
			}, this);

			var appCanLaunchErrorCallback = _.bind(function(errMsg){
				// app not installed try to open app store
				this.$el.find(".reflectup-message").hide();
				this.$el.find(".reflectup-appstore").show();

				if (device.platform == "Android"){
					window.open("https://play.google.com/store/apps/details?id=de.unipotsdam.reflectup&hl=de", "_system");
				}else if(device.platform == "iOS"){
					window.open("https://itunes.apple.com/de/app/reflect-up/id930109466?mt=8", "_system");
				}
			}, this);

			/*
			 *	handlers for app launching
			 */
			var appLaunchSuccessCallback = _.bind(function(data){
				console.log(data);
			}, this);

			var appLaunchErrorCallback = _.bind(function(errMsg){
				this.$el.find(".reflectup-error").show();
			}, this);


			if (window.cordova){
				console.log('trying launch');
				window.plugins.launcher.canLaunch({uri:'reflectup://'}, appCanLaunchSuccessCallback, appCanLaunchErrorCallback);
			}else{
				// in web view simply open webpage on click
				this.$el.find(".reflectup-message").hide();
				this.$el.find(".reflectup-website").show();
			}
		},

		render: function(){
			this.$el = this.page;
			this.$el.attr('id', 'reflectup');
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			this.trigger("afterRender");
			return this;
		}
	});

	return app.views;
});