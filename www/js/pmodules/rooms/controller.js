define([
    "controllers/baseController",
    "pmodules/rooms/room"
], function(BaseController) {

    return BaseController.extend({
        name: "room",

        default: function () {
            app.loadPage('room', 'index');
        }
    });
});