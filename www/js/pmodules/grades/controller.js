define([
    "controllers/baseController",
    "pmodules/grades/grades"
], function(BaseController) {

    return BaseController.extend({
        name: "grades",

        user_grades: function () {
            app.loadPage('grades', 'view');
        }
    });
});