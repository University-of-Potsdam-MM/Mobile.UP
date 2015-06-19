/*
* MainController
*/
app.controllers.main = BackboneMVC.Controller.extend({
    name: 'main',
	modules:{"home" : "HomePageView", "options":"OptionsPageView"},
	
	/*
	* Um evt. Initialisierungsfunktionen auszuführen
	*/
    init:function(){
    },
	
	default:function(){
		this.index();
	},
	/**
	* Zeigt das Hauptmenü an
	*/
    menu:function(){
		var self = this;
		app.loadPage(this.name, 'menu', {}, '-slide'); //Zeigt das Hauptmenü an
    },
	
	logout:function(){
		var self = this;
		app.loadPage('options', 'logout', {}, 'slide'); //Zeigt das Hauptmenü an
    },
	
	login:function(){
		var self = this;
		app.loadPage('options', 'login', {}, 'slide'); //Zeigt das Hauptmenü an
    },
	
	options:function(){
		if(app.session.get('up.session.authenticated'))
			app.route('main/logout');
		else
			app.route('main/login');
    }
	
});