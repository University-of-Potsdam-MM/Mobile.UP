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
            app.loadPage('sitemap', 'index', {
                campus: campus,
                buildingName: buildingName
            });
        }
    });
});