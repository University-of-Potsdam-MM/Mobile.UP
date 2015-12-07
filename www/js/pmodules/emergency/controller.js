define([
    "controllers/baseController",
    "pmodules/emergency/emergency"
], function(BaseController) {

    return BaseController.extend({
        name: "emergency",

        default: function () {
            app.loadPage('emergency', 'index');
        }
    });
});