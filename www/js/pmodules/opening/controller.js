define([
    "controllers/baseController",
    "pmodules/opening/opening"
], function(BaseController) {

    return BaseController.extend({
        name: "opening",

        default: function() {
            app.loadPage('opening', 'index');
        }
    });
});