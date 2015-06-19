/*
* studiesController
*/
app.controllers.studies = BackboneMVC.Controller.extend({
    name: 'studies',
	modules: {
		'calendar' : 'calendarView',
		'lectures' : 'lecturesView',
		'grades' : 'gradesView',
		'moodle' : 'moodleView'
	},
	/*
	* Um Initialisierungsfunktionen auszuführen
	*/
    init:function(){
    },
	
	default:function(){
		
	},
	
	calendar:function(day){
		app.loadPage('calendar', 'index', {day:day});
    },

    lectures:function(vvzUrls){
		var _this = this;
		app.loadPage('lectures', 'index').done(function(){
			var vvzHistory = app.currentView.vvzHistory;
			console.log(vvzUrls);
			if (vvzUrls != undefined) {
				vvzHistory.reset(JSON.parse(vvzUrls));
			} else {
				vvzHistory.reset();
			}
	
			/*_this.listenTo(app.currentView, "openVvzUrl", function(vvzHistory) {
				var param = JSON.stringify(vvzHistory.toJSON());
				var url = "studies/lectures/" + encodeURIComponent(param)
			});*/
		});
    },	
	
	grades:function(){
		app.loadPage('grades', 'index');
    },
	
	moodle:function(action, id){ //action ist immer index, bis jemand das ändern möchte
		action =  'index';
		app.loadPage('moodle', action, {model: app.session, courseid: id});
    },
	
});