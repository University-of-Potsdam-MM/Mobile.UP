
/*
 * initialize map when page is initialized
 */
$(document).on( "pageinit", "#sitemaps", function() {
	// initializeMap();
	
	$('#Terminals:checkbox').click(function() {
		if($(this).is(':checked')) {
			drawTerminals();
		}else{
			console.log(gTerminals);
			for(var i=0;i<gTerminals.length;i++) {
				gTerminals[i].setMap(null);
			}
		}
	});
	
	$('#Institute:checkbox').click(function() {
		if($(this).is(':checked')) {
			drawInstitutes();
		}else{
			console.log(gInstitutes);
			for(var i=0;i<gInstitutes.length;i++) {
				gInstitutes[i].setMap(null);
			}
		}
	});
	
	$('#Mensen:checkbox').click(function() {
		if($(this).is(':checked')) {
			drawMensen();
		}else{
			console.log(gMensen);
			for(var i=0;i<gMensen.length;i++) {
				gMensen[i].setMap(null);
			}
		}
	});
});

/*
 * "pageshow" is deprecated (http://api.jquerymobile.com/pageshow/) but the replacement "pagecontainershow" doesn't seem to trigger
 */
$(document).on("pageshow", "#sitemaps", function() {
	initializeMap();
});

var coords = new google.maps.LatLng(52.39345677934452, 13.128039836883545);
var map = undefined;

/**
 * initializes the map and draws all markers which are currently selected
 */
function initializeMap() {
	drawMap(coords);
	
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
		gMensen = new GeoJSON(data, options);
		if (gMensen.error) {
			console.log(gMensen.error);
		} else {
			for(var i=0;i<gMensen.length;i++) {
				gMensen[i].setMap(map);
			}
		}
		
		insertSearchableFeatureCollection(data);
	});
}

function drawTerminals() {
	var options = {
		    "icon": "img/up/puck-marker.png"
		};
		
	$.getJSON("js/geojson/terminals-griebnitzsee.json", function(data) {
		gTerminals = new GeoJSON(data, options);
		if (gTerminals.error) {
			console.log(gTerminals.error);
		} else {
			for(var i=0;i<gTerminals.length;i++) {
				gTerminals[i].setMap(map);
			}
		}
		
		insertSearchableFeatureCollection(data);
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
		gInstitutes = new GeoJSON(data, options);
		if (gInstitutes.error) {
			console.log(gInstitutes.error);
		} else {
			for(var i=0;i<gInstitutes.length;i++) {
				gInstitutes[i].setMap(map);
			}
		}
		
		insertSearchableFeatureCollection(data);
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
	// Add an overlay to the map of current lat/lng
	marker = new google.maps.Marker({
		position: latlng,
		title: "Greetings!"
	});
	marker.setMap(map);
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

function insertSearchableFeatureCollection(collection) {
	var items = _.map(collection.features, function(item) {
		var result = {};
		result.name = item.properties.Name;
		result.description = item.properties.description;
		return result;
	});
	
	insertSearchables(items);
}
