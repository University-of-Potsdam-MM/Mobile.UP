require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    //waitSeconds: 10,
    paths: {
    	'templates': '../templates',
    	'controllers': '../controllers',
    	'jquery': 'lib/jquery-1.10.2.min',
    	'jquerymobile': 'lib/jquery.mobile-1.4.1.min',
        'datebox': 'lib/jqm-datebox.core.min',
    	'underscore': 'lib/underscore.min',
        'underscore-string': 'lib/underscore.string.min',
    	'backbone': 'lib/backbone.min',
        'async' : 'lib/async',
        'geojson': 'lib/GeoJSON'
    },
    shim: {
        // use namespace Backbone
    	'backbone': {
    		deps: ['jquery', 'underscore'],
    		exports: 'Backbone'
    	},
        // use namespace _
    	'underscore': {
    		exports: '_'
    	},
        // use namespace _str.
        'underscore-string': {
            deps: ['underscore']
        },

         'datebox': {
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