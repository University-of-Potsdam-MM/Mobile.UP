define([
    "controllers/baseController",
    "pmodules/people/people"
], function(BaseController) {

    return BaseController.extend({
        name: "people",

        user_people:function(){
            app.loadPage('people', 'index');
        }
    });
});