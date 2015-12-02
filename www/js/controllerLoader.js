define([
    'jquery',
    //In der app vorhandene Controller
    "controllers/main",
    "controllers/events",
    "controllers/news",
    "controllers/campus", //"Onepager" in einem Controller um platz zu sparen
    "controllers/studies" //"Onepager" in einem Controller um platz zu sparen
], function($) {

    var ControllerLoader = {
        viewFileExt: 'js', //Dateiendung der View files

        /*
         * Alle Controllers und deren Viewtemplates laden
         */
        loadControllersExtract: function () {
            for (var i in app.controllers) {
                app.c[i] = (new app.controllers[i]);
            }
            $(document).trigger('app:controllersLoaded');
        }
    };

    return ControllerLoader;
});
