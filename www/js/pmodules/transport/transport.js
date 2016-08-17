define(['jquery', 'underscore', 'backbone', 'utils', 'moment'], function($, _, Backbone, utils, moment){

    var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/transport");

	var view_state = {campus: 'G-see'};


	/**
	 *  Backbone Model - Departure
	 */
	var Departure = Backbone.Model.extend({
		defaults:{ "time": ""}
	});


	/**
	 *  Backbone Collection - Departures
	 */
	var Departures = Backbone.Collection.extend({
		model: Departure
	});


	/**
	 *  Backbone Model - TransportStation
	 *	provides a Model for the TransportationStations
	 */
	var TransportStation = Backbone.Model.extend({
		defaults:{
			"campus": "",
			"name": "",
			"externalId": "",
			"stationTime": "",
			"departures": ""
		},

		url: 'https://api.uni-potsdam.de/endpoints/transportAPI/2.0/departureBoard?maxJourneys=10',

		initialize: function(){
			this.set('departures', new Departures);
		},

		getMaxDepartingTime: function(){
			var times= _.map(this.get('departures').pluck('time'), function(time){return moment(time,'HH:mm');})
			times.push(moment()); // add now()
			var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
			var max = _.last(sortedTimes);
			return max;
		},

		getMinDepartingTime: function(){
			var times= _.map(this.get('departures').pluck('time'), function(time){return moment(time,'HH:mm');})
			times.push(moment()); // add now()
			var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
			var min = _.first(sortedTimes);

			return min;
		},

		parse: function(data, options){
			this.get('departures').add(data.Departure);
			this.set('stationTime', this.getMinDepartingTime().format('HH:mm') + " - " + this.getMaxDepartingTime().format('HH:mm'));

			return this;
		}
	});

	/**
	 *  Backbone Collection - TransportStations
	 *  holding all stations and delegates fetch to station models
	 */
	var TransportStations = Backbone.Collection.extend({

		model: TransportStation,

		initialize: function(){
			this.add(new TransportStation({campus: "G-see", name: "S Griebnitzsee Bhf", externalId: "009230003"}));
			this.add(new TransportStation({campus: "Golm", name: "Potsdam, Golm Bhf", externalId: "009220010"}));
			this.add(new TransportStation({campus: "Palais", name: "Potsdam, Neues Palais", externalId: "009230132"}));
		},

		fetch: function(){
			this.trigger("request");
			var that = this;

			var successORerror = _.after(3, function(){
				that.trigger("sync");
			});

			_.each(this.models, function(model){
				// get the time of last known departure
				var lastDepartingTime = model.getMaxDepartingTime().add(1,'minute');
				var timeString = lastDepartingTime.format('HH:mm:ss');

				var request = {
						format: 'json',
						id: model.get('externalId'),
						time: timeString
				};

				model.fetch({
					data: request,
					dataType: 'json',
					success: function(collection, response, options){
						successORerror();
					},
					error: function(error, a, b){
						var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Die Transportsuche ist momentan nicht verfügbar', module: 'transport'});
						successORerror();
					}
				});
			});
		}
	});


	/**
	 *  Backbone View - NavigationView
	 *  for navigating between transport and transport2 view
	 */
	var NavigationView = Backbone.View.extend({
		events: {
	  		'click a' : 'selectButton'
		},

		activeButton: function(buttonText){
			this.$el.find('a').removeClass('ui-btn-active');
			this.$el.find('a').filter(function(){
				return $(this).text() === buttonText;
			}).addClass('ui-btn-active');
		},

		selectButton: function(ev){
			ev.preventDefault();
			var buttonName = $(ev.target).html();
			this.trigger('select', buttonName);
		}
	});

	/**
	*  Backbone View - TransportListView
	*/
	var TransportListView = Backbone.View.extend({

		events: {
			'click #later-button' : 'loadNext'
		},

		initialize: function(options) {
			this.stations = options.stations;
			this.updateContent(options.collection, options.stationName, options.stationTime);

			this.template = rendertmpl('transport_listitem_view');

			this.$ul = this.$el.find('ul#transport-list');
			_.bindAll(this, 'addOne');
		},

		updateContent: function(stationDepartures, stationName, stationTime) {
			this.stationName = stationName;
			this.stationTime = stationTime;

			// Forget the old collection
			this.collection.off(null, null, this);
			this.collection = stationDepartures;

			// Listen to changes in the new collection
			this.collection.on("reset", this.render, this);
			this.collection.on("add", this.addOne, this);
		},

		addOne: function(departure) {
			this.$ul.append(this.template({departure: departure}));
		},

		loadNext: function(ev){
			ev.preventDefault();
			this.stations.fetch();
		},

		render: function() {
			this.$el.find('.stationName').html(this.stationName);
			this.$el.find('.stationTime').html(this.stationTime);
			this.$ul.empty();
			this.collection.each(this.addOne);
			return this;
		}
	});


	/**
	*  Transport Page View
	*/
	app.views.TransportPage = Backbone.View.extend({
		attributes: {"id": "transport"},

		initialize: function(){
			this.collection = new TransportStations();
			this.template = rendertmpl('transport');
			this.listenTo(this, "prepareDepartures", this.prepareDepartures);
			this.listenTo(this, "renderTransportList", this.renderTransportList);
			this.listenTo(this.collection.where(view_state)[0], "sync", this.renderTransportList);
		},

		renderTransportList: function(){
			transportViewTransportList = new TransportListView({
				el: this.$el.find('#search-results'),
				stations: this.collection,
				collection: this.collection.where(view_state)[0].get('departures'),
				stationName: this.collection.where(view_state)[0].get('name'),
				stationTime: this.collection.where(view_state)[0].get('stationTime')
			});
			transportViewTransportList.render();
		},

		prepareDepartures: function(){
			this.LoadingView = new utils.LoadingView({collection: this.collection.where(view_state)[0], el: this.$("#loadingSpinner")});

			// check for existing departures otherwise fetch
			if (this.collection.where(view_state)[0].get('departures').length == 0){
				this.collection.fetch();
			}else{
				this.trigger("renderTransportList");
			}
		},

		render: function(){
			this.$el.html(this.template({}));

			fromStation = new NavigationView({
				el: this.$el.find("#from-station-navbar")
			});
			var that = this;
			fromStation.on('select', function(buttonName){
				view_state = {campus: buttonName};
				first_departure = that.collection.where(view_state)[0];
				transportViewTransportList.updateContent(first_departure.get('departures'), first_departure.get('name'), first_departure.get('stationTime'));
				transportViewTransportList.render();
			});

			this.$el.trigger("create");
			this.trigger("prepareDepartures");
			return this;
		}
	});

	return app.views.TransportPage;

});