define([
    "controllers/baseController",
    "history",
    "utils",
    "pmodules/lectures/lectures.models",
    "pmodules/lectures/lectures"
], function(BaseController, customHistory, utils, models) {

    var vvzNavigation = models.VvzNavigation;

    return BaseController.extend({
        name: "lectures",

        lectures: function(headerId, hasSubtree, name) {
            try {
                name = decodeURIComponent(name);
            } catch(ex) {
            }

            var url = "lectures/lectures" + (headerId ? "/" + headerId + "/" + hasSubtree + "/" + encodeURIComponent(name) : "");

            customHistory.resetTo(url);
            var data = vvzNavigation.addOrReset(headerId, name, hasSubtree === "true");
            var model = new models.VvzCategory(null, data);

            app.loadPage('lectures', 'category', {
                currentNode: model,
                vvzNavigation: vvzNavigation
            }).done(function() {
                model.fetch(utils.cacheDefaults({prefillExpires: 120 * 1000}));
            });
        }
    });
});