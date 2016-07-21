define([
    "controllers/baseController",
    "pmodules/grades/grades"
], function(BaseController) {

    return BaseController.extend({
        name: "grades",

        user_grades: function () {
            app.loadPage('grades', 'selection');
        },

        user_view: function (Semester, MtkNr, StgNr) {
            var studentDetails = {Semester: Semester, MtkNr: MtkNr, StgNr: StgNr};
            app.loadPage('grades', 'view', {studentDetails: studentDetails});
        }
    });
});