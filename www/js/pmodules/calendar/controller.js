define([
    "controllers/baseController",
    "pmodules/calendar/calendar",
    "pmodules/calendar/calendar.export"
], function(BaseController) {

    return BaseController.extend({
        name: "calendar",

        user_calendar: function (day) {
            if (day == 'export') {
                app.loadPage('calendarExport', 'index', {day: day});
            } else {
                app.loadPage('calendar', 'index', {day: day});
            }
        }
    });
});