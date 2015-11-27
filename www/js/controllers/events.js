define([
	"backboneMVC",
	"modules/events"
], function(BackboneMVC) {

	/*
	* EventController
	*/
	app.controllers.events = BackboneMVC.Controller.extend({
		name: 'events',
		places: false,

		view:function(id){
			var self = this;
			app.loadPage(this.name, 'view', {id:id, going:Boolean(LocalStore.get('going', {})[id]), fetchCallback: function(model) {
				var d = model.response;
				if(d)
					self.currentEvent = d.event;
				app.viewManager.activeCon().scrollTop(0); //View nach oben scrollen
			}});
		},

		/*
		* Um Initialisierungsfunktionen auszuführen
		*/
		init:function(){
		   this.going = LocalStore.get('going', {}); //Liste der vorgemerkten Events laden
		   this.disabledLocations = LocalStore.get('disabledLocations', {}); //
		},

		default:function(filter){
			this.index(filter);
		},
		/*
		* Eventliste anzeigen
		*/
		index:function(filter){
			var self = this;
			this.filter = filter;
			app.loadPage(this.name, 'index', {filter:this.filter, going:this.going, fetchCallback: function(collection) {
				var d = collection.response;
				if(!d) return;
				self.events = d.events;
				self.places = d.places; //places-liste lokal speichern
				//self.filterIndex(); //Events filtern nach locations und gewählter Zeitraum
				//self.setActiveBtn(); //Aktiven Button markieren im Footer
				console.log(self.places);
			}});
		},

		/*
		* Eventliste einer Location anzeigen
		*/
		place:function(id){
			app.loadPage(this.name, 'place', {id:id}).done(function(){

			});
		},

		/*
		* Locations auswählen
		*/
		set_locations: function(){
			//console.log(this.places);
			if(this.places) { //Wenn die Locations schon lokal vorhanden sind, Seite anzeigen
				app.loadPage(this.name, 'set_locations', {places:this.places, disabledLocations:this.disabledLocations}).done(function(){

				});
			} else { //Sonst zu events/index gehen
				app.route('events/index');
			}
		},

		filter:'',
		/*
		* Eventliste nach filter filtern
		*/
		filterIndex: function(w){
			if(!this.filter)
				this.filter = 'next';
			if(!w) {
				w = this.filter;
			} else
				track('events/filter/'+w);
			var lstr = '', lim = '';
			for(var i in this.disabledLocations) {
				lstr += lim + 'li.location-'+i;
				lim = ',';
			}
			$('#thelist').children('li').css('display', 'none');
			$('#thelist').children('li.show-'+w).not(lstr).css('display', 'block');
			$('#thelist').trigger('resize');
			$('#thelist').trigger('resize');
			this.filter = w;
			this.setActiveBtn();
			window.setTimeout(function(){$(window).trigger('resize');}, 10);
		},

		/*
		* Eventliste Pull to Refresh hinzufügen unter iOS
		*/
		addPullToRefresh:function(){
			app.viewManager.activeCon().pullToRefresh({
				refresh: function (callback) {
					app.refresh(callback);
				}
			});
		},

		/*
		* Sticky Headers in der Eventliste hinzufügen (Feature ist deaktiviert aufgrund von nicht befriedigenden Ergebnissen)
		*/
		stickListDividers: function(){
			return;
			$('body').stacks({
				body: '.ui-content', // This is the container that will house your floating element.
				title: '.up-divider', // The identifier for the elements you want to be fixed, can be any type of jQuery selector
				margin: 0,
				offset: 0,
				fixAndroid: $.os.android,
				touch: $.os.ios,
				fixiOS: $.os.ios
			})
		},

		/*
		* Locations toggeln
		*/
		toggleLocation: function(it){
			var elements = $('#locationlist').find('.ch-location');
			this.disabledLocations = {};
			track('location/toggle/'+$(it).data('id')+'/'+it.checked);
			var self = this;
			elements.each(function(i, el) {
				if(!el.checked)
					self.disabledLocations[$(el).data('id')] = $(el).data('id');
			});
			LocalStore.set('disabledLocations', this.disabledLocations);
		},


	});
});