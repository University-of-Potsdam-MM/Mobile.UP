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
            // respect cache attribute
            if (target.attr('data-dom-cache') != 'true') {
                target.remove();
            }
            $('body').css('overflow', 'auto');
        });
        
        $(document).on('pageshow', 'div[data-role="page"]', function(){
            if (window.approuter && window.approuter.history.length > 0){
                var route = Backbone.history.fragment;
                var pos = window.approuter.getScrollPosition(route);
                $.mobile.silentScroll(pos);
            }
        });

        // Handle buttons e.g. back button throughout the application
        var defs = $.mobile.changePage.defaults;
        $(document).on('click', 'a[data-role="button"]', function(event, ui){

            var $this = $(this);

            if($this.attr('data-transition')) {
                $.mobile.changePage.defaults.transition = $this.attr('data-transition');
            }else{
                $.mobile.changePage.defaults.transition = defs.transition;
            }

            if($this.attr('data-direction')) {
                $.mobile.changePage.defaults.reverse = $this.attr('data-direction') == 'reverse';
            } else {
                $.mobile.changePage.defaults.reverse = false;
            }

            if($this.attr('data-rel') === 'back') {
            }
        });
    });
});