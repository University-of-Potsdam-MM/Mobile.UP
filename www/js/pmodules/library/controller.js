define([
    "controllers/baseController",
    "pmodules/library/library"
], function(BaseController) {

    return BaseController.extend({
        name: "library",

        library:function(detail){
            console.log(Backbone.history.fragment.replace('detail', ''));
            if(detail == 'detail')
                app.route(Backbone.history.fragment.replace('detail', ''), true, true);
            app.loadPage('library', 'index');
        }
    });
});