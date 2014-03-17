var settings =	{
	url: {
		griebnitzsee: {
			terminals: "js/geojson/terminals-griebnitzsee.json",
			institutes: "js/geojson/institutes-griebnitzsee.json",
			canteens: "js/geojson/mensen-griebnitzsee.json",
			center: new google.maps.LatLng(52.39345677934452, 13.128039836883545)
		},
		neuespalais: {
			terminals: "js/geojson/terminals-palais.geojson",
			institutes: "js/geojson/institutes-palais.geojson",
			canteens: "js/geojson/mensen-palais.geojson",
			center: new google.maps.LatLng(52.400933, 13.011653)
		},
		golm: {
			terminals: "js/geojson/terminals-golm.geojson",
			institutes: "js/geojson/institutes-golm.geojson",
			canteens: "js/geojson/mensen-golm.geojson",
			center: new google.maps.LatLng(52.408716, 12.976138)
		}
	},
	options: {
		terminals: { "icon": "img/up/puck-marker.png" },
		canteens: { "icon": "img/up/mensa-marker.png" },
		institutes: {
			"strokeColor": "#FF7800",
		    "strokeOpacity": 1,
		    "strokeWeight": 2,
		    "fillColor": "#46461F",
		    "fillOpacity": 0.5
		}
	}
};

var terminals = "terminals";
var institutes = "institutes";
var canteens = "canteens";

var categoryStore = new CategoryStore();

/*
 * initialize map when page is initialized
 */
$(document).on( "pageinit", "#sitemaps", function() {
	settings.options.institutes.fillColor = $(".sitemap-institutes").css("background-color");
	
	$('#Terminals:checkbox').click(checkUncheck(terminals));
	$('#Institute:checkbox').click(checkUncheck(institutes));
	$('#Mensen:checkbox').click(checkUncheck(canteens));
});

function checkUncheck(category) {
	return function() {
		var visibility;
		if ($(this).is(':checked')) {
			visibility = true;
		} else {
			visibility = false;
		}
		categoryStore.setVisibility(category, visibility);
		_.each(allMarkers.getElements(), function(a) { a.reset(); });
	};
}

$(document).on("pageinit", "#sitemaps", function() {
	$("div[data-role='campusmenu']").campusmenu({ onChange: drawSelectedCampus });
});

/*
 * "pageshow" is deprecated (http://api.jquerymobile.com/pageshow/) but the replacement "pagecontainershow" doesn't seem to trigger
 */
$(document).on("pageshow", "#sitemaps", function() {
	$("div[data-role='campusmenu']").campusmenu("pageshow");
});

function drawSelectedCampus(campusName) {
	uniqueDivId = _.uniqueId("id_");
	
	var campus = undefined;
	if (campusName === "Griebnitzsee") {
		campus = settings.url.griebnitzsee;
	} else if (campusName === "NeuesPalais") {
		campus = settings.url.neuespalais;
	} else {
		campus = settings.url.golm;
	}
	
	Q(clearMenu(uniqueDivId))
		.then(drawCampus(uniqueDivId, campus))
		.catch(function (e) {
			console.log("Fehlschlag: " + e.stack);
			alert("Fehlschlag: " + e.stack);
		});
}

function clearMenu(uniqueDivId) {
	$("#currentCampus").empty();
	$("#currentCampus").append("<div id=\"" + uniqueDivId + "\"></div>");
}

function drawCampus(uniqueDiv, url) {
	return function() {
		var host = $("#" + uniqueDiv);
		host.append("<div data-role='searchablemap'></div>");
		host.trigger("create");
		
		$("div[data-role='searchablemap']", host).searchablemap("pageshow", url.center);
		
		drawCategory(settings.options.terminals, url.terminals, terminals);
		drawCategory(settings.options.institutes, url.institutes, institutes);
		drawCategory(settings.options.canteens, url.canteens, canteens);
	};
}

function drawCategory(options, url, category) {
	$.getJSON(url, function(data) {
		$("div[data-role='searchablemap']").searchablemap("insertSearchableFeatureCollection", options, data, category);
	});
}

function CategoryStore() {
	
	var store = {};
	
	this.isVisible = function(category) {
		if (store[category] === undefined) {
			return true;
		}
		return store[category];
	};
	
	this.setVisibility = function(category, show) {
		store[category] = show;
	};
}

function CategoryMarker(marker, map, category, categoryStore) {
	
	var marker = marker;
	var map = map;
	var category = category;
	var categoryStore = categoryStore;
	
	this.setVisibility = function(show, overrideCategory) {
		if (typeof(overrideCategory)==='undefined') overrideCategory = false;
		
		if (show && overrideCategory) {
			marker.setMap(map);
		} else if (show && !overrideCategory && categoryStore.isVisible(category)) {
			marker.setMap(map);
		} else {
			marker.setMap(null);
		}
	};
	
	this.reset = function() {
		if (categoryStore.isVisible(category)) {
			marker.setMap(map);
		} else {
			marker.setMap(null);
		}
	};
}

var SEARCH_MODE = 0;
var SHOW_MODE = 1;

function SearchableMarkerCollection() {
	
	var elements = [];
	var mode = SHOW_MODE;
	
	this.switchMode = function(targetMode) {
		if (mode === targetMode) {
			return;
		}
		
		switch (targetMode) {
		case SEARCH_MODE:
			// Don't show all markers, only the matching one
			for (var i = 0; i < elements.length; i++) {
				elements[i].setVisibility(false, true);
			}
			break;
		case SHOW_MODE:
			// Show all markers
			for (var i = 0; i < elements.length; i++) {
				elements[i].reset();
			}
			break;
		}
		
		mode = targetMode;
	};
	
	this.getElements = function() {
		return elements;
	};
}
