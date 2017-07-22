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
        'moment': 'vendor/moment-with-locales',
        'utils': 'lib/utils',
        'view.utils': 'lib/view.utils',
		'date': 'vendor/date',
		'LocalStore': 'lib/ls-store',
        'fastclick': 'vendor/fastclick.min',
        'hammerjs': 'vendor/hammer',
        'uri': 'vendor/src',
        'history': 'lib/history',
        'UpApi': 'lib/UpApi',
        'moodle.download': 'lib/moodle.download',
        'stateful.models': 'lib/StatefulModels',
        'PulsAPI': 'lib/PulsAPI',
        'headerParser': 'lib/headerParser'
    },
    // "Paths configurations should only be used for folders, not modules themselves.
    // Map configurations apply to individual modules." See
    //
    // http://stackoverflow.com/questions/12271152/relative-path-doesnt-work-with-paths
    //
    // for details
    map: {
        '*': {
            // opening_hours has to be defined in map configuration, otherwise relative
            // dependencies won't be resolved correctly
            'opening_hours': 'vendor/opening_hours',
            'i18next': 'vendor/i18next',
            'i18next-xhr-backend': 'vendor/i18nextXHRBackend.min',
            'suncalc': 'vendor/suncalc',
            'i18next-client': 'vendor/i18next.amd',
            // SSO login has relative dependencies, too
            'login': 'lib/sso/login.sso.common'
        }
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