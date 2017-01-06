define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'modules/campusmenu',
	'modules/timeselection',
	'pmodules/rooms/room.models'
], function($, _, Backbone, utils, campusmenu, timeselection, models) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/rooms");

	var RoomsOverview = Backbone.View.extend({

		events: {
			"click .room-link": "loadRoom"
		},

		initialize: function() {
			this.listenTo(this.collection, "reset", this.render);
			this.listenTo(this.collection, "error", this.renderError);
		},

		renderError: function(error) {
			new utils.ErrorView({el: '#errorHost', msg: 'Der Raum-Dienst ist momentan nicht erreichbar.', module: 'room', err: error});
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

			var roomDetails = new models.RoomDetailsCollections(null, {
				startTime: new Date(room.startTime),
				endTime: new Date(room.endTime),
				campus: room.campus,
				house: room.house,
				room: room.room
			});
			new RoomDetailsView({el: div, collection: roomDetails});

			roomDetails.fetch(utils.cacheDefaults({reset: true}));
		}
	});

	var RoomDetailsView = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl('roomDetails');

			this.listenTo(this.collection, "reset", this.render);
			this.listenTo(this.collection, "error", this.render);
		},

		events: {
			'click button': 'roomsReset'
		},

		roomsReset: function(){
			$("div[data-role='campusmenu']").campusmenu("changeTo", lastRoomsCampus);
		},

		render: function() {
			var reservations = this.collection.getSortedReservations();
			var attributes = this.collection;

			this.$el.empty();
			this.$el.append(this.template({reservations: reservations, room: attributes}));
			this.$el.trigger("create");
		}
	});

	var lastRoomsCampus = undefined;

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

			this.$("#roomsHost").empty();

			var roomsModel = new models.RoomsCollection(null, {
				startTime: timeBounds.from,
				endTime: timeBounds.to,
				campus: campusName
			});
			new RoomsOverview({el: this.$("#roomsHost"), collection: roomsModel});

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
			this.$("#roomsHost").empty();

			var roomsModel = new models.RoomsCollection(null, {campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
			new RoomsOverview({el: this.$("#roomsHost"), collection: roomsModel});

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
