define(['jquery', 'underscore', 'backbone', 'utils', 'modules/campusmenu', 'modules/timeselection', 'underscore-string'], function($, _, Backbone, utils, campusmenu, timeselection){

	$(document).on("pageinit", "#room", function () {
		$("div[data-role='campusmenu']").campusmenu({ onChange: updateRoomData });
		$("div[data-role='timeselection']").timeselection({ onChange: updateTimeData });
	});

	$(document).on("pageshow", "#room", function () {
		$("div[data-role='campusmenu']").campusmenu("pageshow");
		$("div[data-role='timeselection']").timeselection("pageshow");
	});


	function selector(li) {
		var house = li.attr("data-house");
		return "Haus " + house;
	};

	var Room = Backbone.Model.extend({

		initialize: function() {
			var raw = this.get("raw");
			var attributes = this.parseFreeRoom(raw);
			this.set(attributes);
		},

		/*
		 * Code taken from http://area51-php.erstmal.com/rauminfo/static/js/ShowRooms.js?cb=1395329676756 with slight modifications
		 */
		parseFreeRoom: function(room_string) {
	        var room_match = room_string.match(/^([^\.]+)\.([^\.]+)\.(.+)/);

			var room = {};
	        if (room_match) {
	            room.campus = room_match[1];
	            room.house = parseInt(room_match[2], 10);
	            room.room = room_match[3];
	        } else {
				room.raw = room_string;
			}
			return room;
	    }
	});

	var RoomsCollection = Backbone.Collection.extend({
		model: Room,

		initialize: function() {
			this.enrich = _.bind(this.enrichData, this);
		},

		parse: function(response) {
			var results = response["rooms4TimeResponse"]["return"];
			return _.map(results, this.enrich);
		},

		enrichData: function(result) {
			return {
				raw: result,
				startTime: this.startTime.toISOString(),
				endTime: this.endTime.toISOString()
				};
		}
	});

	var FreeRooms = Backbone.Model.extend({

		initialize: function() {
			this.rooms = new RoomsCollection();
			this.rooms.url = this.createUrl();
			this.rooms.startTime = this.get("startTime");
			this.rooms.endTime = this.get("endTime");

			this.rooms.on("reset", _.bind(this.triggerChanged, this));
			this.rooms.on("error", this.requestFail);
		},

		triggerChanged: function() {
			this.trigger("change");
		},

		mapToId: function(campusName) {
			var campusId;
			if (campusName === "griebnitzsee") {
				campusId = 3;
			} else if (campusName === "neuespalais") {
				campusId = 1;
			} else {
				campusId = 2;
			}
			return campusId;
		},

		createUrl: function() {
			var campus = this.mapToId(this.get("campus"));
			var building = this.get("building");
			var startTime = this.get("startTime");
			var endTime = this.get("endTime");

			var request = "http://api.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
			if (building) {
				request = request + "&building=%s";
			}
			return _.str.sprintf(request, encodeURIComponent(startTime.toISOString()), encodeURIComponent(endTime.toISOString()), campus, building);
		},

		requestFail: function(error) {
			alert("Daten nicht geladen");
		}
	});

	var RoomDetailsCollections = Backbone.Collection.extend({
		model: function(attrs, options) {
			attrs.startTime = new Date(attrs.startTime);
			attrs.endTime = new Date(attrs.endTime);
			attrs.title = attrs.veranstaltung;
			return new Backbone.Model(_.omit(attrs, "veranstaltung"));
		},

		parse: function(response) {
			if (typeof response.reservations4RoomResponse === "object") {
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

			this.reservations.on("reset", _.bind(this.triggerChanged, this));
			this.reservations.on("error", _.bind(this.triggerChanged, this));
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

			var request = "http://api.uni-potsdam.de/endpoints/roomsAPI/1.0/reservations4Room?format=json&startTime=%s&endTime=%s&campus=%s&building=%s&room=%s";
			return _.sprintf(request, encodeURIComponent(startTime), encodeURIComponent(endTime), encodeURIComponent(this.get("campus")), encodeURIComponent(this.get("house")), encodeURIComponent(this.get("room")));
		}
	});

	var RoomsOverview = Backbone.View.extend({

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			$("#roomsDetailsHint").hide();
			$("#roomsOverviewHint").show();

			var host = this.$el;
			host.empty();

			var attributes = this.model.rooms.map(function(model) { return model.attributes; });

			// Create and add html
			var createRooms = utils.rendertmpl('rooms');
			var htmlDay = createRooms({rooms: _.groupBy(attributes, "house")});
			host.append(htmlDay);

			// Refresh html
			host.trigger("create");

			$("a", host).bind("click", function(event) {
				event.preventDefault();

				var href = $(this).attr("href");
				var roomDetails = new URI(href).search(true).room;
				if (roomDetails) {
					var room = JSON.parse(roomDetails);
					showRoomDetails(room);
				}
			});
		}
	});

	var RoomDetailsView = Backbone.View.extend({

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			$("#roomsOverviewHint").hide();
			$("#roomsDetailsHint").show();

			var host = this.$el;
			host.empty();

			var reservations = this.model.reservations.map(function(d) { return d.attributes; });

			// Create and add html
			var createDetails = utils.rendertmpl('roomDetails');
			var htmlDay = createDetails({reservations: reservations, room: this.model.attributes});
			host.append(htmlDay);

			// Refresh html
			host.trigger("create");
		}
	});

	function updateTimeData(bounds) {
		var campus = $("div[data-role='campusmenu']").campusmenu("getActive");
		updateRoom(campus, bounds);
	}

	function updateRoomData(campus) {
		var timeBounds = $("div[data-role='timeselection']").timeselection("getActive");
		updateRoom(campus.campusName, timeBounds);
	}

	function showRoomDetails(room) {
		currentView && currentView.remove();
		var div = $("<div></div>").appendTo("#roomsHost");

		var roomDetails = new RoomDetailsModel({campus: room.campus, house: room.house, room: room.room, startTime: new Date(room.startTime), endTime: new Date(room.endTime)});
		currentView = new RoomDetailsView({el: div, model: roomDetails});

		roomDetails.reservations.fetch({reset: true});
	}

	var lastRoomsCampus = undefined;
	var currentView = undefined;

	function updateRoom(campusName, timeBounds) {
		lastRoomsCampus = campusName;
		currentView && currentView.remove();
		var div = $("<div></div>").appendTo("#roomsHost");

		var roomsModel = new FreeRooms({campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
		currentView = new RoomsOverview({el: div, model: roomsModel});

		roomsModel.rooms.fetch({reset: true});
	}

	function roomsReset() {
		$("div[data-role='campusmenu']").campusmenu("changeTo", lastRoomsCampus);
	}

	var RoomPageView = Backbone.View.extend({
		attributes: {"id": 'room'},

		initialize: function(){
			this.template = utils.rendertmpl('room');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		}
	});

	return RoomPageView;

});