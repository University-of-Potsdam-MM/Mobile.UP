$(document).on("pageinit", "#rooms", function () {
	$("div[data-role='campusmenu']").campusmenu({ onChange: updateRoomData });
	$("div[data-role='timeselection']").timeselection({ onChange: updateTimeData });
});

$(document).on("pageshow", "#rooms", function () {
	$("div[data-role='campusmenu']").campusmenu("pageshow");
});

$(function() {
	$.widget("up.timeselection", {
		options: {
			onChange: function(bounds) {}
		},
		
		_create: function() {
			// create html code
			this.element.append(
				'<div data-role="controlgroup"> \
					<legend>Zeitraum:</legend> \
					<input type="radio" id="radioNow" name="roomTime" checked="checked" /> \
					<label for="radioNow" id="radioNowLabel" data-template="Jetzt (%02d:%02d-%02d:%02d)">Jetzt</label> \
					<input type="radio" id="radioNext" name="roomTime" /> \
					<label for="radioNext" id="radioNextLabel" data-template="Demnächst (%02d:%02d-%02d:%02d)">Demnächst</label> \
				</div>');
			this.element.trigger("create");
			
			// Set current time values in radio labels
			var template = $("#radioNowLabel").attr("data-template");
			
			var now = new Date();
			var centered = this._upperAndLowerDate(now);
			var upper = centered.upper;
			var lower = centered.lower;
			var label = _.sprintf(template, lower.getHours(), lower.getMinutes(), upper.getHours(), upper.getMinutes());
			
			$("#radioNowLabel").text(label);
			$("#radioNow").attr("data-timestamp", now.toISOString());
			$("#radioNow").checkboxradio("refresh");
			
			var template = $("#radioNextLabel").attr("data-template");
			
			now.setHours(now.getHours() + 2);
			centered = this._upperAndLowerDate(now);
			upper = centered.upper;
			lower = centered.lower;
			label = _.sprintf(template, lower.getHours(), lower.getMinutes(), upper.getHours(), upper.getMinutes());
			
			$("#radioNextLabel").text(label);
			$("#radioNext").attr("data-timestamp", now.toISOString());
			$("#radioNext").checkboxradio("refresh");
			
			var widgetHost = this;
			$(":radio").bind("change", function (event) {
				var bounds = widgetHost._retreiveActiveBounds($(this));
				widgetHost.options.onChange({ from: bounds.lower, to: bounds.upper });
			});
		},
		
		_destroy: function() {
		},
		
		_setOption: function(key, value) {
			this._super(key, value);
		},
		
		_upperAndLowerDate: function(center) {
			var lowerHour = center.getHours() - (center.getHours() % 2);
			var upperHour = lowerHour + 2;
			
			var lower = new Date(center.getFullYear(), center.getMonth(), center.getDate(), lowerHour, 0, 0, 0);
			var upper = new Date(center.getFullYear(), center.getMonth(), center.getDate(), upperHour, 0, 0, 0);
			return {upper: upper, lower: lower};
		},
		
		_retreiveActiveBounds: function(activeElement) {
			var timestamp = activeElement.attr("data-timestamp");
			var time = new Date(timestamp);
			return this._upperAndLowerDate(time);
		},
		
		getActive: function() {
			var activeId = $(".ui-radio-on", this.element).attr("for");
			var bounds = this._retreiveActiveBounds($("#" + activeId));
			return { from: bounds.lower, to: bounds.upper };
		}
	});
});

function selector(li) {
	var house = li.attr("data-house");
	return "Haus " + house;
};

var FreeRooms = Backbone.Model.extend({
	
	mapToId: function(campusName) {
		var campusId;
		if (campusName === "griebnitzsee") {
			campusId = 3;
		} else if (campusName === "neuespalais") {
			campusId = 1;
		} else {
			campusId = 2;
		}
		return campusId
	},
	
	loadFreeRooms: function(filter) {
		var campus = this.mapToId(filter.campus);
		var building = filter.building;
		var startTime = filter.startTime;
		var endTime = filter.endTime;
		
		var request = "http://usb.soft.cs.uni-potsdam.de/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
		if (building) {
			request = request + "&building=%s";
		}
		request = _.sprintf(request, encodeURIComponent(startTime.toISOString()), encodeURIComponent(endTime.toISOString()), campus, building);
		
		headers = { "Authorization": getAuthHeader() };
		$.ajax({
			url: request,
			headers: headers
		}).done(this.requestSuccess(filter)).fail(this.requestFail);
	},
	
	requestSuccess: function(filter) {
		var modelHost = this;
		return function(result) {
			var rooms = result["rooms4TimeResponse"]["return"];
			rooms = _.chain(rooms)
						.map(modelHost.parseFreeRoom)
						.map(function(room) { return _.extend(room, { startTime: filter.startTime.toISOString() }); })
						.map(function(room) { return _.extend(room, { endTime: filter.endTime.toISOString() }); })
						.value();
			
			modelHost.set({rooms: rooms});
		};
	},
	
	requestFail: function(error) {
		alert("Daten nicht geladen");
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

var RoomDetailsModel = Backbone.Model.extend({
	
	loadRoomDetails: function(room) {
		this.set({room: room});
		
		// Set start and end time
		var startTime = new Date(room.startTime);
		startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 0, 0, 0, 0);
		startTime = startTime.toISOString();
		var endTime = new Date(room.endTime);
		endTime = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate() + 1, 0, 0, 0, 0);
		endTime = endTime.toISOString();
		
		var request = "http://usb.soft.cs.uni-potsdam.de/roomsAPI/1.0/reservations4room?format=json&startTime=%s&endTime=%s&campus=%s&building=%s&room=%s";
		request = _.sprintf(request, encodeURIComponent(startTime), encodeURIComponent(endTime), encodeURIComponent(room.campus), encodeURIComponent(room.house), encodeURIComponent(room.room));
		headers = { "Authorization": getAuthHeader() };
		$.ajax({
			url: request,
			headers: headers
		}).done(this.showRoomDetailsSuccess()).fail(this.showRoomDetailsFail());
	},
	
	showRoomDetailsSuccess: function() {
		var modelHost = this;
		return function(data) {
			modelHost.trigger("change");
		};
	},
	
	showRoomDetailsFail: function() {
		var modelHost = this;
		return function() {
			modelHost.trigger("change");
		};
	}
});

var RoomsOverview = Backbone.View.extend({
	
	initialize: function() {
		this.listenTo(this.model, "change", this.render);
	},
	
	render: function() {
		var host = this.$el;
		host.empty();
		
		// Create and add html
		var createRooms = rendertmpl('rooms');
		var htmlDay = createRooms({rooms: this.model.get("rooms")});
		host.append(htmlDay);
		
		// Refresh html
		$("#roomsList").listview({
			autodividers: true,
			autodividersSelector: selector
		});
		host.trigger("create");
		
		$("a", host).bind("click", function(event) {
			event.preventDefault();
			
			var href = $(this).attr("href");
			var roomDetails = new URI(href).search(true).room;
			var room = JSON.parse(roomDetails);
			showRoomDetails(room);
		});
	}
});

var RoomDetailsView = Backbone.View.extend({
	
	initialize: function() {
		this.listenTo(this.model, "change", this.render);
	},
	
	render: function() {
		var room = this.model.get("room");
		
		// Create and add html
		var host = this.$el;
		host.empty();
		host.append("<legend>Reservierungen für Haus " + room.house + " Raum " + room.room + "</legend>");
		host.append('<h3>Diese Ansicht ist derzeit deaktiviert!</h3>');
		host.append('<ul id="reservationsforroom" data-role="listview" style="margin: 1px;"></ul>');
		host.append("<button onclick='roomsReset()'>Zurück</button>");
		host.trigger("create");
		
		$("#reservationsforroom").listview("refresh");
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
	
	var roomDetails = new RoomDetailsModel;
	currentView = new RoomDetailsView({el: div, model: roomDetails});
	
	roomDetails.loadRoomDetails(room);
}

var lastRoomsCampus = undefined;
var currentView = undefined;

function updateRoom(campusName, timeBounds) {
	lastRoomsCampus = campusName;
	currentView && currentView.remove();
	var div = $("<div></div>").appendTo("#roomsHost");
	
	var roomsModel = new FreeRooms;
	currentView = new RoomsOverview({el: div, model: roomsModel});
	
	roomsModel.loadFreeRooms({campus: campusName, startTime: timeBounds.from, endTime: timeBounds.to});
}

function roomsReset() {
	$("div[data-role='campusmenu']").campusmenu("changeTo", lastRoomsCampus);
}
