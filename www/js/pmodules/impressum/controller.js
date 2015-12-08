define([
    "controllers/baseController",
    "pmodules/impressum/impressum"
], function(BaseController) {

    return BaseController.extend({
        name: "impressum",

        default: function(){
            app.loadPage('impressum', 'index');
        }
    });
});