define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore.string',
    'utils',
    'q',
    'history'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory) {

    var ControllerLoader = {
        viewFileExt: 'js', //Dateiendung der View files
        controllerList: [
            "controllers/main",
            "controllers/events",
            "controllers/news",
            "controllers/campus", //"Onepager" in einem Controller um platz zu sparen
            "controllers/studies" //"Onepager" in einem Controller um platz zu sparen
        ], //In der app vorhandene Controller

        /*
         * Alle Controllers und deren Viewtemplates laden
         */
        loadControllersExtract: function () {
            require(this.controllerList, function () {
                for (var i in app.controllers) {
                    app.c[i] = (new app.controllers[i]);
                    if (app.c[i].init) {
                        app.c[i].init();
                    }
                }
                $(document).trigger('app:controllersLoaded');
            });
        }
    };

    return ControllerLoader;
});
