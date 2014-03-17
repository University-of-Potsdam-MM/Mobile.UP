/*
 * 
 $(document).bind("mobileinit", function () {
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
});

var AppRouter = Backbone.Router.extend({
	 
    routes:{
        "":"home",
        "page1":"page1",
        "page2":"page2"
    },
 
    home:function () {
        this.changePage(new HomeView());
    },
 
    page1:function () {
        this.changePage(new Page1View());
    },
 
    page2:function () {
        this.changePage(new Page2View());
    },
 
    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
    }
 
});





$(document).on("pageinit", "#emergency", function () {
	
	// create instance of our emergency collection
	var emergencyCalls = new EmergencyCalls();
	
	// pass collection to emergency view
	var emergencyCallsView = new EmergencyCallsView({collection: emergencyCalls});
	//console.log(emergencyCallsView.render().el);

	$('#emergencies').append(emergencyCallsView.render().el);
	
	$.mobile.changePage(emergencyCallsView.render().el);
	
});