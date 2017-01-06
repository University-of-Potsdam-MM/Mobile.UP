define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'modules/campusmenu',
	'modules/timeselection',
	'underscore.string',
	'moment'
], function($, _, Backbone, utils, campusmenu, timeselection, _str, moment){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/rooms");

	var RoomsCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.startTime = options.startTime;
			this.endTime = options.endTime;
			this.campus = options.campus;
			this.building = options.building;
		},

		/*
		 * Code taken from http://area51-php.erstmal.com/rauminfo/static/js/ShowRooms.js?cb=1395329676756 with slight modifications
		 */
		model: function(attrs) {
			var room_match = attrs.raw.match(/^([^\.]+)\.([^\.]+)\.(.+)/);

	        if (room_match) {
	        	attrs.campus = room_match[1];
	        	attrs.house = parseInt(room_match[2], 10);
	        	attrs.room = room_match[3];
	        }
			return new Backbone.Model(attrs);
		},

		parse: function(response) {
			var results = response.rooms4TimeResponse["return"];
			return _.map(results, this.enrichData, this);
		},

		enrichData: function(result) {
			return {
				raw: result,
				startTime: this.startTime.toISOString(),
				endTime: this.endTime.toISOString()
			};
		},

		url: function() {
			var campusId = {
				"griebnitzsee": 3,
				"neuespalais": 1,
				"golm": 2
			};
			var campus = campusId[this.campus] || 2;

			var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
			if (this.building) {
				request = request + "&building=%s";
			}
			return _str.sprintf(request, encodeURIComponent(this.startTime.toISOString()), encodeURIComponent(this.endTime.toISOString()), campus, this.building);
		}
	});

	var RoomDetailsCollections = Backbone.Collection.extend({

		model: function(attrs, options) {
			attrs.startTime = new Date(attrs.startTime);
			attrs.endTime = new Date(attrs.endTime);
			attrs.startMoment = moment(attrs.startTime);
			attrs.endMoment = moment(attrs.endTime);
			attrs.title = attrs.veranstaltung;
			return new Backbone.Model(_.omit(attrs, "veranstaltung"));
		},

		parse: function(response) {
			if (typeof response.reservations4RoomResponse === "object" && response.reservations4RoomResponse  != null) {
				// The response is non-empty
				var reservations = response.reservations4RoomResponse["return"];

				if (Array.isArray(reservations)) {
					return reservations;
				} else {
					return [reservations];
				}
			} else {
				return [];
			}
		}
	});

	var RoomDetailsModel = Backbone.Model.extend({

		initialize: function() {
			this.reservations = new RoomDetailsCollections;
			this.reservations.url = this.createUrl();

			this.listenTo(this.reservations, "reset", this.triggerChanged);
			this.listenTo(this.reservations, "error", this.triggerChanged);
		},

		triggerChanged: function() {
			this.trigger("change");
		},

		createUrl: function() {
			// Set start and end time
			var startTime = this.get("startTime");
			startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 0, 0, 0, 0);
			startTime = startTime.toISOString();
			var endTime = this.get("endTime");
			endTime = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate() + 1, 0, 0, 0, 0);
			endTime = endTime.toISOString();

			var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/reservations4Room?format=json&startTime=%s&endTime=%s&campus=%s&building=%s&room=%s";
			return _str.sprintf(request, encodeURIComponent(startTime), encodeURIComponent(endTime), encodeURIComponent(this.get("campus")), encodeURIComponent(this.get("house")), encodeURIComponent(this.get("room")));
		},

		getSortedReservations: function() {
			var reservations = this.reservations.map(function(d) { return d.attributes; });
			return _.sortBy(reservations, "startMoment");
		}
	});

	var RoomsOverview = Backbone.View.extend({

		events: {
			"click .room-link": "loadRoom"
		},

		initialize: function() {
			this.listenTo(this.collection, "reset", this.render);
			this.listenTo(this.collection, "error", this.renderError);
		},

		renderError: function(error) {
			var errorPage = new utils.ErrorView({el: '#errorHost', msg: 'Der Raum-Dienst ist momentan nicht erreichbar.', module: 'room', err: error});
			this.$el.empty();
		},

		render: function() {
			// Clear error
			$("#errorHost").empty();

			// Show hint for rooms overview
			$("#roomsDetailsHint").hide();
			$("#roomsOverviewHint").show();

			var host = this.$el;
			host.empty();

			var attributes = this.collection.map(function(model) { return model.attributes; });

			// Create and add html
			var createRooms = rendertmpl('rooms');
			var htmlDay = createRooms({groupedRooms: _.groupBy(attributes, "house")});
			host.append(htmlDay);

			// Refresh html
			host.trigger("create");
		},

		loadRoom: function(event) {
			event.preventDefault();

			var rawRoom = $(event.currentTarget).data("room");
			var attributes = this.collection.map(function(model) { return model.attributes; });
			var roomModel =_.find(attributes, function(model) { return model.raw === rawRoom; });

			this._showRoomDetails(roomModel);
		},

		_showRoomDetails: function(room) {
			this.$el.empty();
			var div = $("<div></div>").appendTo(this.$el);

			var roomDetails = new RoomDetailsModel({campus: room.campus, house: room.house, room: room.room, startTime: new Date(room.startTime), endTime: new Date(room.endTime)});
			currentView = new RoomDetailsView({el: div, model: roomDetails});

			roomDetails.reservations.fetch(utils.cacheDefaults({reset: true}));
		}
	});

	var RoomDetailsView = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl('roomDetails');
			this.listenTo(this.model, "change", this.render);
		},

		events: {
			'click button': 'roomsReset'
		},

		roomsReset: function(){
			$("div[data-role='campusmenu']").campusmenu("changeTo", lastRoomsCampus);
		},

		render: function() {
			var reservations = this.model.getSortedReservations();
			var attributes = this.model.attributes;

			this.$el.empty();
			this.$el.append(this.template({reservations: reservations, room: attributes}));
			this.$el.trigger("create");
		}
	});

	var lastRoomsCampus = undefined;
	var currentView = undefined;

	app.views.RoomReservations = Backbone.View.extend({

		initialize: function() {
		},

		render: function() {
			this.setElement(this.page);
			this.$el.html("<div>Reservierungen hier</div>");
		}
	});

	app.views.RoomIndex = Backbone.View.extend({

		initialize: function(){
		},

		render: function(){
			this.setElement(this.page);

			this.$("div[data-role='campusmenu']").campusmenu("pageshow", true);
			this.$("div[data-role='timeselection']").timeselection("pageshow", true);

			var campusName = this.$("div[data-role='campusmenu']").campusmenu("getActive");
			var timeBounds = this.$("div[data-role='timeselection']").timeselection("getActive");

			lastRoomsCampus = campusName;

			var host = this.$("#roomsHost");
			host.empty();
			var div = $("<div></div>").appendTo(host);

			var roomsModel = new RoomsCollection(null, {campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
			currentView = new RoomsOverview({el: div, collection: roomsModel});

			roomsModel.fetch(utils.cacheDefaults({reset: true}));

			return this;
		}
	});

	app.views.RoomPage = Backbone.View.extend({
		attributes: {"id": 'room'},

		initialize: function(){
			this.template = rendertmpl('room.base');
			_.bindAll(this, 'updateTimeData', 'updateRoomData');
		},

		updateTimeData: function(bounds) {
			var campus = this.$("div[data-role='campusmenu']").campusmenu("getActive");
			this.updateRoom(campus, bounds);
		},

		updateRoomData: function(campus) {
			var timeBounds = this.$("div[data-role='timeselection']").timeselection("getActive");
			this.updateRoom(campus.campusName, timeBounds);
		},

		updateRoom: function(campusName, timeBounds) {
			lastRoomsCampus = campusName;
			currentView && currentView.remove();
			var div = $("<div></div>").appendTo("#roomsHost");

			var roomsModel = new RoomsCollection(null, {campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
			currentView = new RoomsOverview({el: div, collection: roomsModel});

			roomsModel.fetch(utils.cacheDefaults({reset: true}));
		},

		render: function(){
			this.$el.html(this.template({}));

			// Switch infotext header according to view state (collapsible expanded or collapsible collapsed)
			this.$(".infotext-header-show").show();
			this.$(".infotext-header-hide").hide();
			this.$(".infotext").collapsible({

				collapse: function() {
					$(".infotext-header-show").show();
					$(".infotext-header-hide").hide();
				},

				expand: function() {
					$(".infotext-header-show").hide();
					$(".infotext-header-hide").show();
				}
			});

			this.$("div[data-role='campusmenu']").campusmenu({ onChange: this.updateRoomData });
			this.$("div[data-role='timeselection']").timeselection({ onChange: this.updateTimeData });

			return this;
		}
	});

});
