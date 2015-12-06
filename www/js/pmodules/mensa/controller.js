define([
    "controllers/baseController",
    "modules/mensa"
], function(BaseController) {

    return BaseController.extend({
        name: "mensa",

        default: function() {
            app.loadPage('mensa', 'index');
        }
    });
});