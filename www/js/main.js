require.config({
    //Standardmäßig alles aus dem lib-Pfad laden
    baseUrl: 'js',
    paths: {
    	templates: '../templates',
    	controllers: '../controllers'
    }
});

require(['app'], function(App){
	App.initialize();
});