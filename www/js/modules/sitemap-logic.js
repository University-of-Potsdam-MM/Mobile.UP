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


/*
 * initialize map when page is initialized
 */
$(document).on( "pageinit", "#sitemaps", function() {
	// initializeMap();
	
	var checkboxSettings = {
		terminals: {
			draw: drawTerminals,
			elements: undefined // gTerminals
		},
		institutes: {
			draw: drawInstitutes,
			elements: undefined // gInstitutes
		},
		canteens: {
			draw: drawMensen,
			elements: undefined // gMensen
		}
	};
	
	$('#Terminals:checkbox').click(checkUncheck(checkboxSettings.terminals));
	$('#Institute:checkbox').click(checkUncheck(checkboxSettings.institutes));
	$('#Mensen:checkbox').click(checkUncheck(checkboxSettings.canteens));
});

function checkUncheck(checkboxSettings) {
	return function() {
		if($(this).is(':checked')) {
			checkboxSettings.draw();
		}else{
			console.log(checkboxSettings.elements);
			makeInvisible(checkboxSettings.elements);
		}
	};
}

function makeInvisible(markers) {
	for(var i=0;i<markers.length;i++) {
		markers[i].setMap(null);
	}
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
		// Don't show all markers, only the matching one
		for (var i = 0; i < allMarkers.length; i++) {
			allMarkers[i].setMap(null);
		}
		
		var source = $("a", this);
		var href = source.attr("href");
		var index = parseInt(href.slice(1));
		if (!result) {
			searchedMarkers[index].setMap(map);
		} else {
			searchedMarkers[index].setMap(null);
		}
	} else {
		// Show all markers
		for (var i = 0; i < allMarkers.length; i++) {
			allMarkers[i].setMap(map);
			searchedMarkers[i].setMap(null);
		}
	}
	
	return result;
}

/**
 * initializes the map and draws all markers which are currently selected
 */
function initializeMap() {
	drawMap(coords);
	markers = [];
	allMarkers = [];
	searchedMarkers = [];
	
	if($('#Mensen:checkbox').is(':checked')) {
		drawMensen();
	}

	if($('#Institute:checkbox').is(':checked')) {
		drawInstitutes();
	}
	
	if($('#Terminals:checkbox').is(':checked')) {
		drawTerminals();
	}
	
}

function drawMensen() {
	var options = {
		    "icon": "img/up/mensa-marker.png"
		};
		
	$.getJSON("js/geojson/mensen-griebnitzsee.json", function(data) {
		insertSearchableFeatureCollection(options, data);
	});
}

function drawTerminals() {
	var options = {
		    "icon": "img/up/puck-marker.png"
		};
		
	$.getJSON("js/geojson/terminals-griebnitzsee.json", function(data) {
		insertSearchableFeatureCollection(options, data);
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
		insertSearchableFeatureCollection(options, data);
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
	for (var i = 0; i < allMarkers.length; i++) {
		allMarkers[i].setMap(null);
	}
	for (var i = 0; i < searchedMarkers.length; i++) {
		searchedMarkers[i].setMap(null);
	}
	
	// Show the selected marker
	searchedMarkers[index].setMap(map);
});

var markers;
var allMarkers;
var searchedMarkers;

function insertSearchableFeatureCollection(options, collection) {
	var items = _.map(collection.features, function(item) {
		var result = {};
		result.name = item.properties.Name;
		result.description = item.properties.description;
		
		// Save item context
		var context = JSON.parse(JSON.stringify(collection));
		context.features = [item];
		
		// Save marker and get its index
		result.index = saveMarker(options, context);
		
		return result;
	});
	
	insertSearchables(items);
	insertMapsMarkers(items);
}

function insertMapsMarkers(items) {
	for (var i in items) {
		var m = loadMarker(items[i].index);
		var gMarkers = new GeoJSON(m.context, m.options);
		var tmpMarkers = new GeoJSON(m.context, m.options);
		
		if (gMarkers.error) {
			console.log(gMarkers.error);
		} else {
			gMarkers[0].setMap(map);
			tmpMarkers[0].setMap(null);
			
			allMarkers[items[i].index] = gMarkers[0];
			searchedMarkers[items[i].index] = tmpMarkers[0];
		}
	}
}

function saveMarker(options, context) {
	markers.push({options: options, context: context});
	return markers.length - 1;
}

function loadMarker(index) {
	return markers[index];
}
