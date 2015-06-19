/*
* CampusController
*/
app.controllers.campus = BackboneMVC.Controller.extend({
    name: 'campus',
	modules: {
		'sitemap' : 'sitemapView',
		'room' : 'roomView',
		'opening' : 'openingView',
		'transport' : 'transportView',
		'transport2' : 'transportPlanView', 
		'mensa' : 'mensaView',
		'emergency' : 'emergencyView',
		'library' : 'libraryView',
		'people' : 'peopleView',
		'impressum' : 'impressumView',
	},
	/*
	* Um Initialisierungsfunktionen auszuführen
	*/
    init:function(){
    },
	
	default:function(){
		this.index();
	},
	
	sitemap:function(){
		app.loadPage('sitemap', 'index');
    },

    room:function(){
		app.loadPage('room', 'index');
    },
	
	opening:function(){
		app.loadPage('opening', 'index');
    },
	
	transport:function(type, campus){
		if(type == 'plan')
			app.loadPage('transport', 'plan');
    	else
			app.loadPage('transport', 'index');
    },
	
	mensa:function(){
		app.loadPage('mensa', 'index');
    },
	
	emergency:function(){
		app.loadPage('emergency', 'index');
    },
	
	library:function(){
		app.loadPage('library', 'index');
    },
	
	people:function(){
		app.loadPage('people', 'index');
    },
	
	impressum:function(){
		app.loadPage('impressum', 'index');
    },
});