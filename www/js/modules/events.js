define(['jquery', 'underscore', 'backbone', 'utils', 'date', 'LocalStore'], function($, _, Backbone, utils, date, LocalStore){

	/*
	 *
	 */
	app.models.Event = Backbone.Model.extend({
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/events/view/',
		initialize: function(){
			this.url = this.url + this.id;
		},
		parse: function(response){
			if(response.vars)
				response = response.vars;
			return response;
		}
	});

	app.models.Events = Backbone.Collection.extend({
		model: app.models.Event,
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/events/',

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.events;
		},

	});

	app.models.Place = Backbone.Collection.extend({
		model: app.models.Event,
		url: 'http://musang.soft.cs.uni-potsdam.de/potsdamevents/json/events/place/',

		initialize: function(p){
			this.url = this.url + p.id;
		},

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.events;
		},

	});

	app.views.EventsView = Backbone.View.extend({
		events : {'click .saveToCal': 'saveToCalendar'},
		inCollection : 'events.index.events', //controller.action.variable
		idInCollection : 'id', //name oder . getrennter Pfad, wo die id in der collection steht für ein objekt
		initialize: function(p){
			this.template = utils.rendertmpl('events.view');
			_.bindAll(this, 'render');
			this.page = p.page;
			this.model = new app.models.Event(p);
			this.model.fetch({
				success: this.render,
				dataType: 'json' });
		},

		render:function(){
			this.undelegateEvents();
			
			var vars = this.model.toJSON();
			if(!vars.event)
				vars.event = vars;
			this.$el = this.page.$el.find('#events');// $(this.el, this.page.$el)
			vars = $.extend(vars, {going:Boolean(LocalStore.get('going', {})[vars.event.Event.id])});
			this.$el.html(this.template(vars));
			this.$el.trigger("create");
			$('.back').click(function(e){window.history.back(); e.preventDefault(); e.stopPropagation();});
			
			this.delegateEvents();
			return this;
		},

		/*
		* Das aktuell angezeigte Event im Kalender speichern
		*/
		saveToCalendar:function(){
			var e = this.model.toJSON();
			if(!e.Event)
				e = e.event;
			var saved = false;
			window.plugins.calendar.createEvent(e.Event.name, e.Place.name, e.Event.description, new Date(parseInt(e.Event.startTime) * 1000), new Date((parseInt(e.Event.startTime) + 3600) * 1000 ),
				function(m){ //Bei erfolgreichem Speichern ausgeführt, unter Android leider nicht ausgeführt
					navigator.notification.alert(e.Event.name + ' am ' + e.Event.DateString + ' wurde deinem Kalender hinzugefügt.', null, 'Gespeichert'); //Nachricht ausgeben
					LocalStore.set('going', e.Event.id, e.Event.id); //Vorgemerkt im Local Storage speichern
					$('#savedInCal'+e.Event.id).show(); //VOrgemerkt Häckchen anzeigen
					saved = true;
					track('events/calendar/'+e.Event.id+'/saved'); //Aktion tracken
				},
				function(m){ //Bei einem Fehler beim Speichern ausgeführt
					if(m != 'User cancelled')
					navigator.notification.alert("Das Event konnte nicht in deinem Kalender gespeichert werden. Bitte überprüfe in den Einstellungen ob du der App den Zugriff auf deinen Kalender erlaubst.", null, 'Fehler'); //Fehlermeldung ausgeben
					saved = false;
				}
			);
		}

	});

	app.views.EventsPlace = Backbone.View.extend({
		el: '#events',
		initialize: function(p){
			this.template = utils.rendertmpl('events.place');
			this.collection = new app.models.Place(p);
			this.page = p.page;
			this.filter = p.filter;
			app.data.events = p.events;

			_.bindAll(this, 'render');
			//this.going = LocalStore.get('going', {}); //Liste der vorgemerkten Events laden
	   		//this.disabledLocations = LocalStore.get('disabledLocations', {});
			if(!app.data.events)
				this.collection.fetch({
					success: this.render,
					dataType: 'json' });
			else
				this.render();
		},

		fetchError: function(){
			throw new Error('Error loading JSON file');
		},

		render: function(){
			this.$el = this.page.$el.find('#events');
			console.log(this.$el);
			this.$el.html(this.template({events: this.collection.toJSON(), date:date, going:LocalStore.get('going', {})}));
			var self = this;
			this.$el.trigger("create");
			$('.back').attr('href', '#events');
			return this;
		}
	});

	app.views.EventsSet_locations = Backbone.View.extend({
		el: '#events',

		initialize: function(p){
			this.template = utils.rendertmpl('events.set_locations');
			this.page  = p.page;
			_.bindAll(this, 'render', 'toggleLocation');
			window.setTimeout(this.render, 10); //Strange hack so that this.$el is found
		},

		render:function(){
			this.$el = this.page.$el.find('#events');
			this.$el.html(this.template({places: app.data.places, disabledLocations: LocalStore.get('disabledLocations', {})}));
			$('.ch-location').change(this.toggleLocation);
			this.$el.trigger("create");
			$('.back').attr('href', '#events');
			return this;
		},

		/*
		* Locations toggeln
		*/
		toggleLocation: function(it){
			var elements = $('#locationlist').find('.ch-location');
			this.disabledLocations = {};
			var self = this;
			elements.each(function(i, el) {
				if(!el.checked)
					self.disabledLocations[$(el).data('id')] = $(el).data('id');
			});
			LocalStore.set('disabledLocations', this.disabledLocations);
		},
	});

	app.views.EventsIndex = Backbone.View.extend({
		el: '#events',
		initialize: function(p){
			this.template = utils.rendertmpl('events.index');
			this.collection = new app.models.Events(p);
			this.page = p.page;
			this.filter = p.filter;
			_.bindAll(this, 'render', 'filterIndex');
			//this.going = LocalStore.get('going', {}); //Liste der vorgemerkten Events laden
	   		//this.disabledLocations = LocalStore.get('disabledLocations', {});
			this.collection.fetch({
				success: this.render,
				dataType: 'json' });
		},

		fetchError: function(){
			throw new Error('Error loading JSON file');
		},

		render: function(){
			app.data.places = this.collection.response.places;
			this.$el = this.page.$el.find('#events');
			this.$el.html(this.template({events: this.collection.toJSON(), date:date, going:LocalStore.get('going', {})}));
			var self = this;
			$('.btn-filter-events').click(function(e){
				e.preventDefault();
				self.filterIndex($(this).data('filter'));
			});
			this.filterIndex(this.filter);
			this.$el.trigger("create");
			return this;
		},

		filterIndex: function(w){
			if(!this.filter)
				this.filter = 'next';
			if(!w) {
				w = this.filter;
			} else
			var lstr = '', lim = '';
			for(var i in LocalStore.get('disabledLocations', {})) {
				lstr += lim + 'li.location-'+i;
				lim = ',';
			}
			$('#eventlist').children('li').css('display', 'none');
			$('#eventlist').children('li.show-'+w).not(lstr).css('display', 'block');
			$('#eventlist').trigger('resize');
			this.filter = w;
			Backbone.history.navigate('events/index/'+this.filter, { trigger : false });
			//this.setActiveBtn();
			window.setTimeout(function(){$(window).trigger('resize');}, 10);
		}
	});

	app.views.EventsPage = Backbone.View.extend({

		initialize: function(vars){
			this.template = utils.rendertmpl('events');
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			return this;
		}
	});

	return app.views;

});

//going[id] marker in template missing