define([
    "controllers/baseController",
    "pmodules/transport/transport",
    "pmodules/transport/transport2"
], function(BaseController) {

    return BaseController.extend({
        name: "transport",

        transport:function(type, campus){
            if(type == 'plan')
                app.loadPage('transport2', 'index');
            else
                app.loadPage('transport', 'index');
        }
    });
});