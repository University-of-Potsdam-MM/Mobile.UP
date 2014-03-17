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
var finder = {};
var lastFinderId = undefined;
var lastCampus = undefined;

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
	lastFinderId = uniqueDivId;
	lastCampus = options.campusName;
	
	var campus = undefined;
	if (options.campusName === "griebnitzsee") {
		campus = settings.url.griebnitzsee;
	} else if (options.campusName === "neuespalais") {
		campus = settings.url.neuespalais;
	} else {
		campus = settings.url.golm;
	}
	
	var search = undefined;
	if (options["meta"] !== undefined) {
		search = options.meta;
	}
	
	Q(clearMenu(uniqueDivId))
		.then(loadAllCampusData(uniqueDivId))
		.spread(function(a, b, c) {})
		.then(drawCampus(uniqueDivId, campus))
		.spread(setSearchValue(search))
		.catch(function (e) {
			console.log("Fehlschlag: " + e.stack);
			alert("Fehlschlag: " + e.stack);
		});
}

function clearMenu(uniqueDivId) {
	$("#currentCampus").empty();
	$("#currentCampus").append("<div id=\"" + uniqueDivId + "\"></div>");
}

function loadAllCampusData(uniqueDivId) {
	return function() {
		finder[uniqueDivId] = new SitemapFinder();
		
		var gr = Q(loadCategory(settings.url.griebnitzsee.institutes))
					.then(insertHash)
					.then(insertCampusData(uniqueDivId, "griebnitzsee"));
		
		var go = Q(loadCategory(settings.url.golm.institutes))
					.then(insertHash)
					.then(insertCampusData(uniqueDivId, "golm"));
		
		var np = Q(loadCategory(settings.url.neuespalais.institutes))
					.then(insertHash)
					.then(insertCampusData(uniqueDivId, "neuespalais"));
		
		return [gr, go, np];
	}
}

function insertHash(data) {
	_.each(data.features, function(item) {
		item.properties.hash = (item.properties.Name || "").hashCode() + " " + (item.properties.description || "").hashCode();
	});
	return data;
}

function insertCampusData(uniqueDivId, campus) {
	return function(data) {
		finder[uniqueDivId].addData(data, campus);
	};
}

function drawCampus(uniqueDiv, url) {
	return function() {
		var host = $("#" + uniqueDiv);
		host.append("<div data-role='searchablemap'></div>");
		host.trigger("create");
		
		$("div[data-role='searchablemap']", host).searchablemap("pageshow", url.center);
		
		var terminalsData = Q(loadCategory(url.terminals))
							.then(drawCategory(settings.options.terminals, terminals));
		
		var institutesData = Q(loadCategory(url.institutes))
							.then(insertHash)
							.then(drawCategory(settings.options.institutes, institutes));
		
		var canteensData = Q(loadCategory(url.canteens))
							.then(drawCategory(settings.options.canteens, canteens));
		
		return [terminalsData, institutesData, canteensData];
	};
}

function setSearchValue(search) {
	return function(terminals, institutes, canteens) {
		if (search !== undefined) {
			$("input[data-type='search']").val(search);
			$("div[data-role='searchablemap']").searchablemap("viewByName", search);
			// $("input[data-type='search']").trigger("keyup");
		}
	};
}

function loadCategory(url) {
	var d = Q.defer();
	$.getJSON(url).done(d.resolve).fail(d.reject);
	return d.promise;
}

function drawCategory(options, category) {
	return function(data) {
		$("div[data-role='searchablemap']").searchablemap("insertSearchableFeatureCollection", options, data, category);
	};
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

function searchSimilarLocations(hash) {
	var entry = finder[lastFinderId].findEntryByHash(hash);
	var similarHouses = finder[lastFinderId].findHouseNumberOnOtherCampuses(entry.data.Name, lastCampus);
	var similarDescriptions = finder[lastFinderId].findDescriptionOnOtherCampuses(entry.data.description, lastCampus);
	
	var host = $("#" + lastFinderId);
	host.empty();
	host.append("<ul id='similarlocations' data-role='listview' style='margin: 8px;'></ul>");
	host.append("<button onclick='sitemapReset()'>Zurück</button>");
	host.trigger("create");
	
	var similars = similarHouses.concat(similarDescriptions);
	similars = _.uniq(similars, false, function(item) { return item.data; });
	
	_.each(similars, function(item) {
		$("#similarlocations").append("<li><a onclick='sitemapNavigateTo(\"" + item.hash + "\")'>" + item.data.Name + " (" + item.campus + ")</a></li>");
	});
	
	$("#similarlocations").listview("refresh");
}

function sitemapReset() {
	$("div[data-role='campusmenu']").campusmenu("changeTo", lastCampus);
}

function sitemapNavigateTo(hash) {
	var entry = finder[lastFinderId].findEntryByHash(hash);
	$("div[data-role='campusmenu']").campusmenu("changeTo", entry.campus, entry.data.Name);
}

function SitemapFinder() {
	
	var dataEntries = [];
	
	this.addData = function(data, campus) {
		_.each(data.features, function(item) {
			dataEntries.push({ campus: campus, data: item.properties, hash: item.properties.hash });
		});
	};
	
	this.findHouseNumberOnOtherCampuses = function(house, currentCampus) {
		return _.chain(dataEntries)
				.filter(function(entry) { return entry.data.Name == house; })
				.filter(function(entry) { return entry.campus.toLowerCase() != currentCampus.toLowerCase(); })
				.value();
	};
	
	this.findDescriptionOnOtherCampuses = function(search, currentCampus) {
		return _.chain(dataEntries)
				.filter(function(entry) { return (entry.data.description || "").indexOf(search) !== -1; })
				.filter(function(entry) { return entry.campus.toLowerCase() != currentCampus.toLowerCase(); })
				.value();
	};
	
	this.findEntryByHash = function(hash) {
		return _.chain(dataEntries)
				.filter(function(entry) { return entry.hash == hash; })
				.first()
				.value();
	};
}
