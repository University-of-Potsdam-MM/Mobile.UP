define([
    "controllers/baseController",
    "pmodules/lectures/lectures"
], function(BaseController) {

    return BaseController.extend({
        name: "lectures",

        lectures: function (vvzUrls) {
            if (vvzUrls) {
                vvzUrls = decodeURIComponent(vvzUrls);
                vvzUrls = atob(vvzUrls);
            }

            app.loadPage('lectures', 'index').done(function () {
                var vvzHistory = app.currentView.vvzHistory;
                console.log(vvzUrls);
                if (vvzUrls != undefined) {
                    vvzHistory.reset(JSON.parse(vvzUrls));
                } else {
                    vvzHistory.reset();
                }

                vvzHistory.on("vvzNavigateRequired", function(vvzHistory) {
                    var param = JSON.stringify(vvzHistory.toJSON());
                    param = btoa(param);
                    app.route("lectures/lectures/" + encodeURIComponent(param), true);
                });
            });
        }
    });
});