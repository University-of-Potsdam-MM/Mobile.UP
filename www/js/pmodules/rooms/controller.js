define([
    "controllers/baseController",
    "pmodules/rooms/room"
], function(BaseController) {

    return BaseController.extend({
        name: "room",

        default: function () {
            app.loadPage('room', 'index');
        },

        reservations: function(room) {
            room = decodeURIComponent(room);
            room = atob(room);

            app.loadPage('room', 'reservations', {room: JSON.parse(room)});
        }
    });
});