define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	$(document).bind("mobileinit", function () {
		$.mobile.ajaxEnabled = false;
	    $.mobile.linkBindingEnabled = false;
	    $.mobile.hashListeningEnabled = false;
	    $.mobile.pushStateEnabled = false;
	    $.mobile.defaultPageTransition = 'slidefade';

	    // Remove page from DOM when it's being replaced
	    $(document).on('pagehide', 'div[data-role="page"]', function(event, ui){
            $(event.currentTarget).remove();
            $('body').css('overflow', 'auto');
   		});
	});
});