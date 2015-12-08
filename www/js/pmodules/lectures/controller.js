define([
    "controllers/baseController",
    "pmodules/lectures/lectures"
], function(BaseController) {

    return BaseController.extend({
        name: "lectures",

        lectures: function (vvzUrls) {
            var _this = this;
            app.loadPage('lectures', 'index').done(function () {
                var vvzHistory = app.currentView.vvzHistory;
                console.log(vvzUrls);
                if (vvzUrls != undefined) {
                    vvzHistory.reset(JSON.parse(vvzUrls));
                } else {
                    vvzHistory.reset();
                }

                /*_this.listenTo(app.currentView, "openVvzUrl", function(vvzHistory) {
                 var param = JSON.stringify(vvzHistory.toJSON());
                 var url = "lectures/lectures/" + encodeURIComponent(param)
                 });*/
            });
        }
    });
});