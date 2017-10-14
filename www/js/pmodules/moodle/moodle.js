define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'Session'
], function($, _, Backbone, utils, Session) {
    var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/moodle");

    var AppModel = Backbone.Model.extend({
        defaults: {
            iosStoreUrl : 'https://itunes.apple.com/de/app/moodle-mobile/id633359593?mt=8',
            androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.moodle.moodlemobile&hl=de'
        }
    });

    app.views.MoodlePage = Backbone.View.extend({
        render: function(){
            this.$el.html('');
            return this;
        }
    });

    app.views.MoodleIndex = Backbone.View.extend({
        attributes: {"id": 'moodle'},
        model: AppModel,

        initialize: function(p){
            this.page = p.page;
            this.template = rendertmpl('moodle');
            this.model = new AppModel();
            this.listenToOnce(this, "afterRender", this.startAppLaunch);
        },

        startAppLaunch: function() {
            /*
             *  handlers for trying to app launch
             */
            var appCanLaunchSuccessCallback = _.bind(function(data){
                // try to launch app
                app.route("main/menu", false, true);
                window.plugins.launcher.launch({uri:'moodlemobile://', flags: window.plugins.launcher.FLAG_ACTIVITY_NEW_TASK}, appLaunchSuccessCallback, appLaunchErrorCallback);
            }, this);

            var appCanLaunchErrorCallback = _.bind(function(errMsg){
                // app not installed try to open app store
                this.$el.find(".moodle-message").hide();
                this.$el.find(".moodle-appstore").show();
                this.launchAppStore();
            }, this);

            /*
             *  handlers for app launching
             */
            var appLaunchSuccessCallback = _.bind(function(data){
                this.$el.find(".moodle-message").hide();
                this.$el.find(".moodle-appstore").show();
            }, this);

            var appLaunchErrorCallback = _.bind(function(errMsg){
                this.$el.find(".moodle-message").hide();
                this.$el.find(".moodle-appstore").show();
                this.launchAppStore();
            }, this);

            window.plugins.launcher.launch({uri:'moodlemobile://', flags: window.plugins.launcher.FLAG_ACTIVITY_NEW_TASK}, appLaunchSuccessCallback, appLaunchErrorCallback);
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
            this.$el.attr('id', 'moodle');
            this.$el.html(this.template({model: this.model}));
            this.$el.trigger("create");

            this.trigger("afterRender");
            return this;
        }
    });

    return app.views;
});