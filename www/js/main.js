/**
 *  file contains all Require.JS dependencies
 */
var app = {models:{}, views:{}, data:{}};
require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    //waitSeconds: 10,
    paths: {
    	'templates': '../templates',
    	'controllers': '../controllers',
    	'jquery': 'vendor/jquery',
        'jquerymobile-config': 'jqm-config',
    	'jquerymobile': 'vendor/jquery.mobile',
        'datebox': 'lib/jqm-datebox',
    	'underscore': 'vendor/underscore-min',
        'underscore-string': 'vendor/underscore.string.min',
    	'backbone': 'vendor/backbone-min',
        'cache': 'vendor/backbone.fetch-cache',
        'geojson': 'lib/GeoJSON',
        'q': 'vendor/q',
        'moment': 'vendor/moment.min',
        'utils': 'lib/utils',
		'date': 'lib/date',
		'LocalStore': 'lib/ls-store',
        'fastclick': 'vendor/fastclick.min',
        'hammerjs': 'vendor/hammer',
        'uri': 'vendor/src',
        'history': 'lib/history',
        'moodle.download': 'lib/moodle.download',
        'headerParser': 'lib/headerParser'
    },
    shim: {
        'cache': ['backbone', 'underscore']
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

    });
});