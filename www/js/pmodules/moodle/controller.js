define([
    "controllers/baseController",
    "pmodules/moodle/moodle"
], function(BaseController) {

    return BaseController.extend({
        name: "moodle",

        user_moodle: function (action, id) { //action ist immer index, bis jemand das ändern möchte
            action = 'index';
            app.loadPage('moodle', action, {model: app.session, courseid: id});
        }
    });
});