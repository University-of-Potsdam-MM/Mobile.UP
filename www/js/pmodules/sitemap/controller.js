define([
    "controllers/baseController",
    "pmodules/sitemap/sitemap"
], function(BaseController) {

    return BaseController.extend({
        name: "sitemap",

        default: function () {
            app.loadPage('sitemap', 'index');
        }
    });
});