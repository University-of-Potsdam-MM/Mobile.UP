$(document).on("pageinit", "#rooms", function () {
	$("#roomsList").listview({
		autodividers: true,
		autodividersSelector: selector
	});
	
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
			
			var lower = new Date(center.getFullYear(), center.getMonth(), center.getDay(), lowerHour, 0, 0, 0);
			var upper = new Date(center.getFullYear(), center.getMonth(), center.getDay(), upperHour, 0, 0, 0);
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

function updateTimeData(bounds) {
	var campus = $("div[data-role='campusmenu']").campusmenu("getActive");
	updateRoom(campus, bounds);
}

function updateRoomData(campus) {
	var timeBounds = $("div[data-role='timeselection']").timeselection("getActive");
	updateRoom(campus.campusName, timeBounds);
}

function updateRoom(campusName, timeBounds) {
	var campusId;
	if (campusName === "griebnitzsee") {
		campusId = 3;
	} else if (campusName === "neuespalais") {
		campusId = 1;
	} else {
		campusId = 2;
	}
	
	new FreeRooms().showFreeRooms({campus: campusId, startTime: timeBounds.from, endTime: timeBounds.to});
}

function FreeRooms() {
	
	this.showCurrentFreeRooms = function(filter) {
	};
	
	this.showNextFreeRooms = function(filter) {
	};
	
	this.showFreeRooms = function(filter) {
		var campus = filter.campus;
		var building = filter.building;
		var startTime = filter.startTime;
		var endTime = filter.endTime;
		
		//var request = "http://usb.soft.cs.uni-potsdam.de/mensaAPI/1.0/readCurrentMeals?format=json&location=Golm";
		var request = "http://usb.soft.cs.uni-potsdam.de/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
		if (building) {
			request = request + "&building=%s";
		}
		request = _.sprintf(request, encodeURIComponent(startTime.toISOString()), encodeURIComponent(endTime.toISOString()), campus, building);
		
		headers = { "Authorization": getAuthHeader() };
		$.ajax({
			url: request,
			headers: headers
		}).done(requestSuccess(filter)).fail(requestFail);
	};
	
	function requestSuccess(filter) {
		return function(result) {
			var rooms = result["rooms4TimeResponse"]["return"];
			
			var host = $("#roomsList");
			host.empty();
			
			_.chain(rooms)
				.map(parseFreeRoom)
				.each(function(room) {
					var html = _.sprintf("<li data-house='%d'> \
											<a class='ui-btn ui-btn-icon-right ui-icon-carat-r'> \
												<h3>%s</h3> \
											</a> \
										</li>", room.house, room.room);
					host.append(html);
				});
			
			host.listview("refresh");
		};
	};
	
	function requestFail(error) {
		alert("Daten nicht geladen");
	};
	
	/*
	 * Code taken from http://area51-php.erstmal.com/rauminfo/static/js/ShowRooms.js?cb=1395329676756 with slight modifications
	 */
	function parseFreeRoom(room_string) {
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
    };
}
