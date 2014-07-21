require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    //waitSeconds: 10,
    paths: {
    	'templates': '../templates',
    	'controllers': '../controllers',
    	'jquery': 'vendor/jquery.min',
        'jquerymobile-config': 'jqm-config',
    	'jquerymobile': 'vendor/jquery.mobile.min',
        'datebox': 'lib/jqm-datebox.core.min',
    	'underscore': 'vendor/underscore-min',
        'underscore-string': 'vendor/underscore.string.min',
    	'backbone': 'vendor/backbone-min',
        'geojson': 'lib/GeoJSON',
        'date': 'lib/date',
        'q': 'vendor/q',
        'moment': 'vendor/moment.min',
        'machina': 'vendor/machina',
        'utils': 'lib/utils'
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

requirejs.onError = function(error){
	var failedId = error.requireModules && error.requireModules[0];

	if(error.requireType === 'timeout'){
		console.log('Timeout of RequireJS-Module:'+error.requireModules);
	}else{
		throw error;
	}
};

require(['jquery', 'app', 'jquerymobile', 'jquerymobile-config'], function($, App){
    $(function(){
	   App.initialize();
    });
});