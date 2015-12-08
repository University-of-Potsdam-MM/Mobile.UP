require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    //waitSeconds: 10,
    paths: {
    	'templates': '../templates',
    	'controllers': 'controllers',
    	'jquery': 'vendor/jquery',
        'jquerymobile-config': 'jqm-config',
    	'jquerymobile': 'vendor/jquery.mobile',
        'datebox': 'vendor/jqm-datebox',
    	'underscore': 'vendor/underscore-min',
        'underscore.string': 'vendor/underscore.string.min',
    	'backbone': 'vendor/backbone-min',
		'backboneMVC': 'vendor/backbone-mvc',
        'cache': 'vendor/backbone.fetch-cache',
        'geojson': 'lib/GeoJSON',
        'q': 'vendor/q',
        'moment': 'vendor/moment.min',
        'utils': 'lib/utils',
		'date': 'vendor/date',
		'LocalStore': 'lib/ls-store',
        'fastclick': 'vendor/fastclick.min',
        'hammerjs': 'vendor/hammer',
        'uri': 'vendor/src',
        'history': 'lib/history',
        'moodle.download': 'lib/moodle.download',
        'headerParser': 'lib/headerParser'
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

// Unfortunately, requirejs cannot force jquerymobile
// to load after jqm-config. Therefore, we have to
// force this dependency by modifying the jQuery Mobile
// code base. See
// 
// https://github.com/jrburke/requirejs/issues/358
// 
// for details
require(['jquery', 'jquerymobile-config', 'jquerymobile', 'app'], function(){
    app.initialize();
});