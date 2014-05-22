require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    paths: {
    	templates: '../templates',
    	controllers: '../controllers',
    	jquery: 'lib/jquery-1.10.2.min',
    	jquerymobile: 'lib/jquery.mobile-1.4.1.min',
        datebox: 'lib/jqm-datebox.core.min',
    	underscore: 'lib/underscore.min',
    	backbone: 'lib/backbone.min',
    },
    shim: {
    	backbone: {
    		deps: ['jquery', 'underscore'],
    		exports: 'Backbone'
    	},
    	underscore: {
    		exports: '_'
    	},
        datebox: {
            deps: ['jquery'],
            exports: 'datebox'
        },

        'lib/jqm-datebox.mode.calbox.min' : ['jquery', 'datebox'],
        'lib/jqm-datebox.mode.datebox.min' : ['jquery', 'datebox'],
        'lib/jquery.mobile.datebox.i18n.en_US.utf8' : ['jquery', 'datebox'],
    }

});

require(['app'], function(App){
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
    $.mobile.defaultPageTransition = 'none';
	App.initialize();
});