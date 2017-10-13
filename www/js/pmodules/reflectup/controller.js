define([
    "controllers/baseController",
    "pmodules/reflectup/reflectup"
], function(BaseController, reflectup) {

    return BaseController.extend({
        name: "reflectup",

        default: function () {
            app.loadPage('reflectup', 'index');
        }
    });
});