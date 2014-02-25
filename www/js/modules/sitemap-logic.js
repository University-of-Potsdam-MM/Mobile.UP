var settings =	{
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
		center: new google.maps.LatLng(52.39345677934452, 13.128039836883545)
	},
	golm: {
		terminals: "js/geojson/terminals-golm.geojson",
		institutes: "js/geojson/institutes-golm.geojson",
		canteens: "js/geojson/mensen-golm.geojson",
		center: new google.maps.LatLng(52.39345677934452, 13.128039836883545)
	}
};

var checkboxSettings = {
	terminals: {
		query: '#Terminals:checkbox',
		draw: drawTerminals,
		elements: []
	},
	institutes: {
		query: '#Institute:checkbox',
		draw: drawInstitutes,
		elements: []
	},
	canteens: {
		query: '#Mensen:checkbox',
		draw: drawMensen,
		elements: []
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
	// initializeMap();
	
	$('#Terminals:checkbox').click(checkUncheck(terminals));
	$('#Institute:checkbox').click(checkUncheck(institutes));
	$('#Mensen:checkbox').click(checkUncheck(canteens));
});

function checkUncheck(category) {
	return function() {
		if ($(this).is(':checked')) {
			categoryStore.setVisibility(category, true);
			_.each(allMarkers.getElements(), function(a) { a.reset(); });
		} else {
			categoryStore.setVisibility(category, false);
			_.each(allMarkers.getElements(), function(a) { a.reset(); });
		}
	};
}

/*
 * "pageshow" is deprecated (http://api.jquerymobile.com/pageshow/) but the replacement "pagecontainershow" doesn't seem to trigger
 */
$(document).on("pageshow", "#sitemaps", function() {
	initializeMap();
	initializeFilter();
});

var coords = new google.maps.LatLng(52.39345677934452, 13.128039836883545);
var map = undefined;

function initializeFilter() {
	$("#filterable-locations").filterable("option", "filterCallback", filterLocations);
}

function filterLocations(index, searchValue) {
	var text = $(this).text();
	var result = text.toLowerCase().indexOf(searchValue) === -1;
	
	if (searchValue) {
		allMarkers.switchMode(SEARCH_MODE);
		// Don't show all markers, only the matching one
		
		var source = $("a", this);
		var href = source.attr("href");
		var index = parseInt(href.slice(1));
		var searchedMarkers = allMarkers.getElements();
		if (!result) {
			searchedMarkers[index].setVisibility(true, true);
		} else {
			searchedMarkers[index].setVisibility(false, true);
		}
	} else {
		allMarkers.switchMode(SHOW_MODE);
	}
	
	return result;
}

/**
 * initializes the map and draws all markers which are currently selected
 */
function initializeMap() {
	drawMap(coords);
	markers = [];
	allMarkers = new SearchableMarkerCollection();
	
	categoryStore.setVisibility(terminals, true);
	categoryStore.setVisibility(canteens, true);
	categoryStore.setVisibility(institutes, true);
	
	drawTerminals();
	drawMensen();
	drawInstitutes();
}

function drawMensen() {
	var options = {
		    "icon": "img/up/mensa-marker.png"
		};
		
	$.getJSON("js/geojson/mensen-griebnitzsee.json", function(data) {
		insertSearchableFeatureCollection(options, data, canteens);
	});
}

function drawTerminals() {
	var options = {
		    "icon": "img/up/puck-marker.png"
		};
		
	$.getJSON("js/geojson/terminals-griebnitzsee.json", function(data) {
		insertSearchableFeatureCollection(options, data, terminals);
	});
}

function drawInstitutes() {
	var options = {
		    "strokeColor": "#FF7800",
		    "strokeOpacity": 1,
		    "strokeWeight": 2,
		    "fillColor": "#46461F",
		    "fillOpacity": 0.25
		};
	
	$.getJSON("js/geojson/institutes-griebnitzsee.json", function(data) {
		insertSearchableFeatureCollection(options, data, institutes);
	});
}


/**
 * draws the initial map and centers on the given coordinate
 * @param {latlng} an object of google maps latlng object
 */
function drawMap(latlng) {
	var myOptions = {
			zoom: 16,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
	map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
}

function insertSearchables(searchables) {
	var createSearchables = render("sitemap");
	var host = $("#filterable-locations");
	
	// Add items to search list
	var htmlSearch = createSearchables({items: searchables});
	host.append(htmlSearch);

	// Tell search list to refresh itself
	host.listview("refresh");
	host.trigger( "updatelayout");
}

$(document).on("click", "#filterable-locations a", function () {
	// Retreive context
	var source = $(this);
	var href = source.attr("href");
	var index = parseInt(href.slice(1));
	
	// Hide all markers
	var tmpMarkers = allMarkers.getElements();
	for (var i = 0; i < tmpMarkers.length; i++) {
		tmpMarkers[i].setVisibility(false, true);
	}
	
	// Show the selected marker
	tmpMarkers[index].setVisibility(true, true);
});

var markers;
var allMarkers;

function insertSearchableFeatureCollection(options, collection, category) {
	var items = _.map(collection.features, function(item) {
		var result = {};
		result.name = item.properties.Name;
		result.description = item.properties.description;
		
		// Save item context
		var context = JSON.parse(JSON.stringify(collection));
		context.features = [item];
		
		// Save marker and get its index
		result.index = saveMarker(options, context, category);
		
		return result;
	});
	
	insertSearchables(items);
	insertMapsMarkers(items);
}

function insertMapsMarkers(items) {
	for (var i in items) {
		var m = loadMarker(items[i].index);
		var gMarkers = new GeoJSON(m.context, m.options);
		
		if (gMarkers.error) {
			console.log(gMarkers.error);
		} else {
			var gMarker = new CategoryMarker(gMarkers[0], map, m.category, categoryStore);
			gMarker.reset();
			
			var tmpMarkers = allMarkers.getElements();
			tmpMarkers[items[i].index] = gMarker;
		}
	}
}

function saveMarker(options, context, category) {
	markers.push({options: options, context: context, category: category});
	return markers.length - 1;
}

function loadMarker(index) {
	return markers[index];
}

function CategoryStore() {
	
	var store = {};
	
	this.isVisible = function(category) {
		if (store[category] === undefined) {
			return false;
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
