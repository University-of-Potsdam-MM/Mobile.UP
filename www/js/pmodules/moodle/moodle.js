define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'Session'
], function($, _, Backbone, utils, Session) {

    app.views.MoodlePage = Backbone.View.extend({

        render: function(){
            this.$el.html('');
            return this;
        }
    });

    app.views.MoodleIndex = Backbone.View.extend({
        attributes: {"id": 'moodle'},

        initialize: function(p){
            this.page = p.page;
            this.template = rendertmpl('moodle');

            this.model = new AppModel({
                "android-store-url" : "https://play.google.com/store/apps/details?id=com.moodle.moodlemobile&hl=de",
                "ios-store-url" : "https://itunes.apple.com/de/app/moodle-mobile/id633359593?mt=8",
                "web-url" : "https://moodle2.uni-potsdam.de"
            });

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

                if (device.platform == "Android"){
                    window.open(this.model.get('android-store-url'), "_system");
                }else if(device.platform == "iOS"){
                    window.open(this.model.get('ios-store-url'), "_system");
                }
            }, this);

            /*
             *  handlers for app launching
             */
            var appLaunchSuccessCallback = _.bind(function(data){
                console.log(data);
            }, this);

            var appLaunchErrorCallback = _.bind(function(errMsg){
                this.$el.find(".moodle-error").show();
            }, this);


            if (window.cordova){
                console.log('trying launch');
                window.plugins.launcher.canLaunch({uri:'moodlemobile://', flags: window.plugins.launcher.FLAG_ACTIVITY_NEW_TASK}, appCanLaunchSuccessCallback, appCanLaunchErrorCallback);
            }else{
                // in web view simply open webpage on click
                this.$el.find(".moodle-message").hide();
                this.$el.find(".moodle-website").show();
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