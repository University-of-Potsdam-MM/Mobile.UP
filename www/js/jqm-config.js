define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	$(document).bind("mobileinit", function () {
		$.mobile.ajaxEnabled = false;
	    $.mobile.linkBindingEnabled = false;
	    $.mobile.hashListeningEnabled = false;
	    $.mobile.pushStateEnabled = false;
	    $.mobile.defaultPageTransition = 'slidefade';

	    // Remove page from DOM when it's being replaced
	    $(document).on('pagehide', 'div[data-role="page"]', function(event, ui){
            var target = $(event.currentTarget);
            if (target.attr('data-dom-cache') != 'true') {
              target.remove();
            }
            $('body').css('overflow', 'auto');
            $('#nav-panel').css('display', 'block');
   		});
	});

	$(document).ready(function(){
		$('body').css('visibility','visible');
	});
});