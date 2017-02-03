define(['jquery', 'underscore', 'backbone', 'utils', 'date', 'viewContainer'], function($, _, Backbone, utils, date, viewContainer){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/events");

	var server = 'https://api.uni-potsdam.de/endpoints/newsAPI';

	var events = {};
	var places = {};

	/*
	 *
	 */
	app.models.Event = Backbone.Model.extend({
		url: function() {
			var id = this.id;
			if (!id && this.response && this.response.Event)
				id = this.response.Event.id;
			return server+'/json/events/view/' + id;
		},
		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response;
		}
	});

	app.models.Events = Backbone.Collection.extend({
		model: app.models.Event,
		url: server + '/json/events/',

		initialize: function() {
			utils.cacheModelsOnSync(this, this.cacheModels);
		},

		cacheModels: function(cache) {
			cache.response = this.response.events[cache.index];
		},

		parse: function(response){
			if(response.vars)
				response = response.vars;
			this.response = response;
			return response.events;
		},

	});

	app.models.Place = Backbone.Collection.extend({
		model: app.models.Event,
		url: server+'/json/events/place/',

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

		initialize: function(p){
			this.template = rendertmpl('events_view');
			_.bindAll(this, 'render');
			this.page = p.page;
			this.model = new app.models.Event(p);

			this.model.p = p;
			this.listenToOnce(this.model, "sync", this.render);
			this.listenToOnce(this.model, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.model.fetch({success: p.fetchCallback, cache: true, expires: 60*60});
		},

		fetchError: function(){
			var errorPage = new utils.ErrorView({el: '#events', msg: 'Die Veranstaltung konnte nicht abgerufen werden.', module: 'events'});
		},

		render:function(){
			// No data? No view!
			if (!this.model.has("Event") && !this.model.has("event")) {
				return;
			}

			this.undelegateEvents();
			var vars = this.model.toJSON();
			if(!vars.event)
				vars.event = vars;
			this.$el = this.page.find('#events');// $(this.el, this.page.$el)
			vars = $.extend(vars, {going:Boolean(utils.LocalStore.get('going', {})[vars.event.Event.id])});
			this.$el.html(this.template(vars));
			this.$el.trigger("create");
			//$('.back').click(function(e){window.history.back(); e.preventDefault(); e.stopPropagation();});
			$.mobile.changePage.defaults.reverse = true;
			$('.back').attr('href', '#events');

			this.delegateEvents();
			return this;
		},

		/**
		* Das aktuell angezeigte Event im Kalender speichern
		*/
		saveToCalendar:function(){
			var e = this.model.toJSON();
			if(!e.Event)
				e = e.event;
			var saved = false;
			window.plugins.calendar.createEventInteractively(e.Event.name, e.Place.name, e.Event.description, new Date(parseInt(e.Event.startTime) * 1000), new Date((parseInt(e.Event.startTime) + 3600) * 1000 ),
				function(m){ //Bei erfolgreichem Speichern ausgeführt, unter Android leider nicht ausgeführt
					navigator.notification.alert(e.Event.name + ' am ' + e.Event.DateString + ' wurde deinem Kalender hinzugefügt.', null, 'Gespeichert'); //Nachricht ausgeben
					utils.LocalStore.set('going', e.Event.id, e.Event.id); //Vorgemerkt im Local Storage speichern
					$('#savedInCal'+e.Event.id).show(); //VOrgemerkt Häckchen anzeigen
					saved = true;
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
			this.template = rendertmpl('events_place');
			this.collection = new app.models.Place(p);
			this.page = p.page;
			this.filter = p.filter;
			events = p.events;
			_.bindAll(this, 'render');

			utils.removeNonExpiringElements(this.collection);

			this.collection.p = p;
			this.listenToOnce(this.collection, "sync", this.render);
			this.listenToOnce(this.collection, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.collection.fetch({cache: true, expires: 60*60});
		},

		fetchError: function(){
			var errorPage = new utils.ErrorView({el: '#events', msg: 'Die Veranstaltungen konnten nicht abgerufen werden.', module: 'events'});
		},


		render: function(){
			// No data? No view!
			if (!this.collection.response) {
				return;
			}

			this.$el = this.page.find('#events');
			this.$el.html(this.template({events: this.collection.toJSON(), date:date, going:utils.LocalStore.get('going', {})}));
			var self = this;
			this.$el.trigger("create");
			$.mobile.changePage.defaults.reverse = false;
			$('.back').attr('href', '#events');
			return this;
		}
	});

	app.views.EventsSet_locations = Backbone.View.extend({

		initialize: function(p){
			this.template = rendertmpl('events_set_locations');
			_.bindAll(this, 'render', 'toggleLocation');
		},

		render:function(){
			this.$el = this.page.find('#events');
			this.$el.html(this.template({places: places, disabledLocations: utils.LocalStore.get('disabledLocations', {})}));
			$('.ch-location').change(this.toggleLocation);
			this.$el.trigger("create");
			$('.back').attr('href', '#events');
			return this;
		},

		/**
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
			utils.LocalStore.set('disabledLocations', this.disabledLocations);
		},
	});

	app.views.EventsIndex = Backbone.View.extend({
		initialize: function(p){
			this.template = rendertmpl('events_index');
			this.collection = new app.models.Events(p);
			this.filter = p.filter;
			_.bindAll(this, 'render', 'filterIndex');

			utils.removeNonExpiringElements(this.collection);

			this.collection.p = p;
			this.listenToOnce(this.collection, "sync", this.render);
			this.listenToOnce(this.collection, "sync", function() {
				viewContainer.pageContainer.updateHeader(this.$el);
			});
			this.collection.fetch({success: p.fetchCallback, cache: true, expires: 60*60});
		},

		fetchError: function(){
			throw new Error('Error loading JSON file');
		},

		render: function(){
			// No data? No view!
			if (!this.collection.response)
				return this;

			places = this.collection.response.places;
			this.$el = this.page.find('#events');
			this.$el.html(this.template({events: this.collection.toJSON(), date:date, going:utils.LocalStore.get('going', {})}));
			var $footer = this.$el.find('.footer');
			this.$el.after($footer); //Footer außerhalb des Containers platzieren
			var self = this;
			$('.btn-filter-events').click(function(e){
				e.preventDefault();
				e.stopPropagation();
				self.filterIndex($(this).data('filter'));
			});
			this.filterIndex(this.filter);
			$.mobile.changePage.defaults.reverse = false;
			$('.back').attr('href', '#home');
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
			for(var i in utils.LocalStore.get('disabledLocations', {})) {
				lstr += lim + 'li.location-'+i;
				lim = ',';
			}
			$('#eventlist').children('li').css('display', 'none');
			$('#eventlist').children('li.show-'+w).not(lstr).css('display', 'block');
			$('#eventlist').trigger('resize');
			this.filter = w;
			Backbone.history.navigate('events/index/'+this.filter, { trigger : false, replace: true });
			this.setActiveBtn();
			window.setTimeout(function(){$(window).trigger('resize');}, 10);
		},

		/*
		* Aktiven Button im Footer der Eventliste anhand des aktuellen filters markieren
		*/
		setActiveBtn:function(){
			var klasse = 'ui-btn-active';
			$('.btn-filter-events.'+klasse).removeClass(klasse);
			$('#btn-'+this.filter+'-events').addClass(klasse);
		}
	});

	app.views.EventsPage = Backbone.View.extend({

		attributes: {"id": 'events'},

		initialize: function(vars){
			this.template = rendertmpl('events');
		},

		render: function(){
			var $el = $(this.el);
			$el.html(this.template({}));
			$el.trigger("create");
			return this;
		}
	});

	return app.views;

});