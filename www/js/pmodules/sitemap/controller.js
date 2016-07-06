define([
    "controllers/baseController",
    "pmodules/sitemap/sitemap"
], function(BaseController) {

    return BaseController.extend({
        name: "sitemap",

        default: function () {
            app.loadPage('sitemap', 'index');
        },

        similars: function(locationId) {
            app.loadPage('sitemap', 'similars', {locationId: locationId});
        },

        changeto: function(campus, buildingName) {
            // Somehow the parameter is decoded when using a clean refresh
            // but not if app.route is called with the encoded parameter
            buildingName = decodeURIComponent(buildingName);

            app.loadPage('sitemap', 'index', {
                campus: campus,
                buildingName: buildingName
            });
        }
    });
});