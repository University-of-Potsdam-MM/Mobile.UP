define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore-string',
    'utils',
    'q',
    'history'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory) {

    var ControllerLoader = {
        viewFileExt: 'js', //Dateiendung der View files

        /*
         * Alle Controllers und deren Viewtemplates laden
         * @urls: Liste der URLs zu den Controller Dateien
         */
        loadControllersExtract: function (urls) {
            var that = this;
            require(urls, function () {
                var views = [], modules = [], viewNames = [], appc = [];
                var c = 0, d = 0;
                for (var i in app.controllers) {
                    app.c[i] = appc[i] = (new app.controllers[i]);
                    console.log(app.c[i]);
                    if (app.c[i].init) {
                        console.log(app.c[i].init);
                        app.c[i].init();
                    }
                    for (var j in appc[i].views) {
                        views[c] = 'text!' + appc[i].views[j] + '.' + that.viewFileExt;
                        viewNames[c] = appc[i].views[j];
                        c++;
                    }
                    if (appc[i].modules)
                        for (var name in appc[i].modules) {
                            modules[d] = 'js/modules/' + name + '.' + that.viewFileExt;
                            d++;
                        }
                }
                require(modules, function () {
                    $(document).trigger('app:controllersLoaded');
                });
            });
        }
    };

    return ControllerLoader;
});
