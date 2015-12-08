define([
    "controllers/baseController",
    "pmodules/home/home"
], function(BaseController) {

    return BaseController.extend({
        name: "main",

        /**
         * Zeigt das Hauptmenü an
         */
        menu: function () {
            var self = this;
            app.loadPage(this.name, 'menu', {}, '-slide'); //Zeigt das Hauptmenü an
        }
    });
});