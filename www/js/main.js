require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    //waitSeconds: 10,
    paths: {
    	'templates': '../templates',
    	'controllers': '../controllers',
    	'jquery': 'lib/jquery-1.10.2.min',
        'jquerymobile-config': 'jqm-config',
    	'jquerymobile': 'lib/jquery.mobile-1.4.1.min',
        'datebox': 'lib/jqm-datebox.core.min',
    	'underscore': 'lib/underscore.min',
        'underscore-string': 'lib/underscore.string.min',
    	'backbone': 'lib/backbone.min',
        'async' : 'lib/async',
        'geojson': 'lib/GeoJSON',
        'date': 'lib/date',
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

        'jquerymobile-config': ['jquery'],

        'jquerymobile': ['jquery', 'jquerymobile-config'],

        'datebox': {
            deps: ['jquery', 'jquerymobile'],
            exports: 'datebox'
        },

        'lib/jqm-datebox.mode.calbox.min' : ['jquery', 'datebox'],
        'lib/jqm-datebox.mode.datebox.min' : ['jquery', 'datebox'],
        'lib/jquery.mobile.datebox.i18n.en_US.utf8' : ['jquery', 'datebox'],
    }

});

require(['jquery', 'app', 'jquerymobile', 'jquerymobile-config'], function($, App){
    $(function(){
	   App.initialize();
    });
});