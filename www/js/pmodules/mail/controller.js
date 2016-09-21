define([
    "controllers/baseController",
    "pmodules/mail/mail"
], function(BaseController, mail) {

    return BaseController.extend({
        name: "mail",

        user_mail: function () {
            app.loadPage('mail', 'index');
        }
    });
});