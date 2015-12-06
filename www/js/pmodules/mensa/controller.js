define([
    "controllers/baseController",
    "pmodules/mensa/views"
], function(BaseController) {

    return BaseController.extend({
        name: "mensa",

        default: function() {
            app.loadPage('mensa', 'index');
        }
    });
});