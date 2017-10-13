define([
    "controllers/baseController",
    "pmodules/moodle/moodle"
], function(BaseController) {

    return BaseController.extend({
        name: "moodle",

        default: function () {
            app.loadPage('moodle', 'index');
        }
    });
});