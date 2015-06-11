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

	var RoomsCollection = Backbone.Collection.extend({

		/*
		 * Code taken from http://area51-php.erstmal.com/rauminfo/static/js/ShowRooms.js?cb=1395329676756 with slight modifications
		 */
		model: function(attrs, options) {
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

			var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
			if (building) {
				request = request + "&building=%s";
			}
			return _.str.sprintf(request, encodeURIComponent(startTime.toISOString()), encodeURIComponent(endTime.toISOString()), campus, building);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#roomsHost', msg: 'Der Raum-Dienst ist momentan nicht erreichbar.', module: 'room', err: error});
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

			var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/reservations4Room?format=json&startTime=%s&endTime=%s&campus=%s&building=%s&room=%s";
			return _.str.sprintf(request, encodeURIComponent(startTime), encodeURIComponent(endTime), encodeURIComponent(this.get("campus")), encodeURIComponent(this.get("house")), encodeURIComponent(this.get("room")));
		}
	});

	var RoomListElementView = Backbone.View.extend({

		events: {
			"click": "loadRoom"
		},

		initialize: function() {
			this.template = utils.rendertmpl("roomListElement");
		},

		render: function() {
			this.undelegateEvents();
			//console.log(this.model);
			this.$el = $(this.template({room: this.model}));
			this.delegateEvents();

			return this;
		},

		loadRoom: function(event) {
			event.preventDefault();
			showRoomDetails(this.model);
		}
	});

	var RoomListGroupView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl("roomList");
		},

		render: function() {
			var roomIndex = _.first(this.collection).house;

			this.undelegateEvents();
			this.$el = $(this.template({roomIndex: roomIndex, rooms: this.collection}));
			this.delegateEvents();

			_.each(this.collection, function(model) {
				var view = new RoomListElementView({model: model});
				this.$(".rooms-subview").append(view.render().$el);
			}, this);

			return this;
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

			// Add room groups
			_.each(_.groupBy(attributes, "house"), function(collection) {
				var view = new RoomListGroupView({collection: collection});
				this.$("#roomsOverviewList").append(view.render().$el);
			});

			// Refresh html
			host.trigger("create");
		}
	});

	var RoomDetailsView = Backbone.View.extend({

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
		},

		events: {
			'click button': 'roomsReset'
		},

		roomsReset: function(){
			$("div[data-role='campusmenu']").campusmenu("changeTo", lastRoomsCampus);
		},

		render: function() {
			$("#roomsOverviewHint").hide();
			$("#roomsDetailsHint").show();

			var host = this.$el;
			host.empty();

			var reservations = this.model.reservations.map(function(d) { return d.attributes; });
			reservations = _.sortBy(reservations, "startMoment");

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

		roomDetails.reservations.fetch(utils.cacheDefaults({reset: true}));
	}

	var lastRoomsCampus = undefined;
	var currentView = undefined;

	function updateRoom(campusName, timeBounds) {
		lastRoomsCampus = campusName;
		currentView && currentView.remove();
		var div = $("<div></div>").appendTo("#roomsHost");

		var roomsModel = new FreeRooms({campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
		currentView = new RoomsOverview({el: div, model: roomsModel});

		roomsModel.rooms.fetch(utils.cacheDefaults({reset: true}));
	}

	var RoomPageView = Backbone.View.extend({
		attributes: {"id": 'room'},

		initialize: function(){
			this.template = utils.rendertmpl('room');
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
			
			return this;
		}
	});

	return RoomPageView;
});
