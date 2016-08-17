define([
    "controllers/baseController",
    "pmodules/tipps/tipp"
], function(BaseController) {

    return BaseController.extend({
        name: "tipp",

        default: function () {
            app.loadPage('tipp', 'index');
        },

        detail: function(name) {
            name = decodeURIComponent(name);
            app.loadPage('tipp', 'detail', {tippName: name});
        }
    });
});