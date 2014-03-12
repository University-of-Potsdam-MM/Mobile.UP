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
 * initialize map when page is shown
 * "pageshow" is deprecated (http://api.jquerymobile.com/pageshow/) but the replacement "pagecontainershow" doesn't seem to trigger
 */
$(document).on("pageshow", "#sitemaps", function() {
	$("div[data-role='campusmenu']").campusmenu("pageshow");
});

function drawSelectedCampus(options) {
	uniqueDivId = _.uniqueId("id_");
	
	var campus = undefined;
	if (options.campusName === "Griebnitzsee") {
		campus = settings.url.griebnitzsee;
	} else if (options.campusName === "NeuesPalais") {
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

function SitemapFinder() {
	
	var houseNames = [];
	var descriptions = [];
	
	this.addData = function(data, campus) {
		_.each(data.features, function(item) {
			houseNames.push({ campus: campus, data: item.properties.Name });
			descriptions.push({ campus: campus, data: item.properties.description });
		});
	};
	
	this.findHouseNumberOnOtherCampuses = function(house, currentCampus) {
		return _.chain(houseNames)
				.filter(function(houseName) { return houseName.data == house; })
				.filter(function(houseName) { return houseName.campus != currentCampus })
				.pluck('data')
				.value();
	};
	
	this.findDescriptionOnOtherCampuses = function(search, currentCampus) {
		return _.chain(descriptions)
				.filter(function(description) { return description.data.indexOf(search) !== -1; })
				.filter(function(description) { return description.campus != currentCampus; })
				.pluck('data')
				.value();
	};
}
