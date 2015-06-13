define(['jquery', 'underscore', 'backbone', 'utils', 'q', 'modules/campusmenu', 'modules/timeselection', 'modules/searchablemap'], function($, _, Backbone, utils, Q, campusmenu, timeselection, searchablemap){

	var settings = {};

	var terminals = "terminals";
	var institutes = "institutes";
	var canteens = "canteens";
	var parking = "parking";
	var associateinstitutes = "associateinstitutes";
	var student = "student";

	var categoryStore = new CategoryStore();
	var lastFinderId = undefined;
	var lastCampus = undefined;
	var searchView = undefined;

	settings =	{
		url: {
			griebnitzsee: {
				campus: "griebnitzsee"
			},
			neuespalais: {
				campus: "neuespalais"
			},
			golm: {
				campus: "golm"
			}
		},
		options: {
			terminals: { "icon": "img/up/puck-marker.png" },
			canteens: { "icon": "img/up/mensa-marker.png" },
			parking: {
				"strokeColor": "#fff",
			    "strokeOpacity": 1,
			    "strokeWeight": 2,
			    "fillColor": "#70c8dc",
			    "fillOpacity": 0.8
			},
			institutes: {
				"strokeColor": "#fff",
			    "strokeOpacity": 1,
			    "strokeWeight": 2,
			    "fillColor": "#e57967",
			    "fillOpacity": 0.8
			},
			associateinstitutes: {
				"strokeColor": "#fff",
			    "strokeOpacity": 1,
			    "strokeWeight": 2,
			    "fillColor": "#cf6da8",
			    "fillOpacity": 0.8
			},
			student: {
				"strokeColor": "#fff",
			    "strokeOpacity": 1,
			    "strokeWeight": 2,
			    "fillColor": "#897cc2",
			    "fillOpacity": 0.8
			}
		}
	};

	var oneSidedGuard = {
		callback: function(options) { drawSelectedCampus(options); },
		isCalled: false,
		isBlocked: true,
		options: undefined,

		callMultiple: function(options) {
			if (this.isBlocked) {
				this.isCalled = true;
				this.options = options;
			} else {
				this.callback(options);
			}
		},

		disableBlock: function() {
			this.isBlocked = false;
			if (this.isCalled) {
				this.callback(this.options);
			}
		}
	};

	$(document).on("pageinit", "#sitemap", function() {
		$.getScript('https://www.google.com/jsapi').done(function(){
			google.load('maps', '3', {other_params: 'sensor=false', callback: function(){
				settings.url.griebnitzsee.center = new google.maps.LatLng(52.39345677934452, 13.128039836883545);
				settings.url.neuespalais.center = new google.maps.LatLng(52.400933, 13.011653);
				settings.url.golm.center = new google.maps.LatLng(52.408716, 12.976138);

				oneSidedGuard.disableBlock();
			}});
		}).fail(function(){
			var errorPage = new utils.ErrorView({el: '#error-placeholder', msg: 'Es ist ein Fehler aufgetreten wahrscheinlich besteht keine Internetverbindung.', module:'sitemap'});
		});
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

	$(document).on("pageinit", "#sitemap", function() {
		$("div[data-role='campusmenu']").campusmenu({ onChange: function(options) { oneSidedGuard.callMultiple(options); } });
	});

	/*
	 * initialize map when page is shown
	 * "pageshow" is deprecated (http://api.jquerymobile.com/pageshow/) but the replacement "pagecontainershow" doesn't seem to trigger
	 */
	$(document).on("pageshow", "#sitemap", function() {
		$("div[data-role='campusmenu']").campusmenu("pageshow");
		searchView = new SearchView({query: "input[data-type='search']", children: "#filterable-locations"});

		$('#Terminals:checkbox').click(checkUncheck(terminals));
		$('#Institute:checkbox').click(checkUncheck(institutes));
		$('#Mensen:checkbox').click(checkUncheck(canteens));
		$('#Parking:checkbox').click(checkUncheck(parking));
		$('#AnInstitute:checkbox').click(checkUncheck(associateinstitutes));
		$('#Living:checkbox').click(checkUncheck(student));

		settings.options.institutes.fillColor = $(".sitemap-institutes").css("background-color");
		settings.options.parking.fillColor = $(".sitemap-parking").css("background-color");
		settings.options.associateinstitutes.fillColor = $(".sitemap-associateinstitutes").css("background-color");
		settings.options.student.fillColor = $(".sitemap-living").css("background-color");
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
			.then(function() { return geo.loadAllOnce(); })
			.then(drawCampus(uniqueDivId, campus))
			.spread(setSearchValue(search))
			.fail(function (error) {
				var errorPage = new utils.ErrorView({el: '#error-placeholder', msg: 'Es ist ein unerwarteter Fehler aufgetreten.', module:'sitemap', err: error});
			});
	}

	function clearMenu(uniqueDivId) {
		$("#currentCampus").empty();
		$("#currentCampus").append("<div id=\"" + uniqueDivId + "\"></div>");
	}

	function onItemSelected(selection) {
		searchView.setSearchValue(selection);
		searchView.hideAllItems();
		// $("div[data-role='searchablemap']").searchablemap("viewByName", selection);
	}

	function drawCampus(uniqueDiv, url) {
		return function() {
			var host = $("#" + uniqueDiv);
			host.append("<div data-role='searchablemap'></div>");
			host.trigger("create");

			$("div[data-role='searchablemap']", host).searchablemap({ onSelected: onItemSelected, categoryStore: categoryStore });
			$("div[data-role='searchablemap']", host).searchablemap("pageshow", url.center);

			var data = geo.filter(function(element) { return element.get("campus") === url.campus; });

			var terminalsData = Q.fcall(getGeoByCategory, data, terminals)
								.then(drawCategory(settings.options.terminals, terminals, url.campus));

			var institutesData = Q.fcall(getGeoByCategory, data, institutes)
								.then(drawCategory(settings.options.institutes, institutes, url.campus));

			var canteensData = Q.fcall(getGeoByCategory, data, canteens)
								.then(drawCategory(settings.options.canteens, canteens, url.campus));

			var parkingData = Q.fcall(getGeoByCategory, data, parking)
								.then(drawCategory(settings.options.parking, parking, url.campus));

			var associateinstitutesData = Q.fcall(getGeoByCategory, data, associateinstitutes)
											.then(drawCategory(settings.options.associateinstitutes, associateinstitutes, url.campus));

			var studentData = Q.fcall(getGeoByCategory, data, student)
								.then(drawCategory(settings.options.student, student, url.campus));

			return [terminalsData, institutesData, canteensData, parkingData, associateinstitutesData, studentData];
		};
	}

	function getGeoByCategory(data, category) {
		var result = _.chain(data)
					.filter(function(element) { return element.get("category") === category; })
					.first()
					.value();
		if (result) {
			return result.get("geo");
		} else {
			return undefined;
		}
	}

	function setSearchValue(search) {
		return function(terminals, institutes, canteens) {
			if (search !== undefined) {
				searchView.setSearchValue(search);
				$("div[data-role='searchablemap']").searchablemap("viewByName", search);
			}
		};
	}

	function drawCategory(options, category, campus) {
		return function(data) {
			if (data) {
				$("div[data-role='searchablemap']").searchablemap("insertSearchableFeatureCollection", options, data, category, hasSimilarLocations(campus));
			}
		};
	}

	function hasSimilarLocations(campus) {
		return function(id) {
			var entry = geo.findEntryById(id);
			var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.geo.properties.Name, campus);
			var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.geo.properties.description, campus);

			return similarHouses.length + similarDescriptions.length > 0;
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

	function searchSimilarLocations(id) {
		var entry = geo.findEntryById(id);
		var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.geo.properties.Name, lastCampus);
		var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.geo.properties.description, lastCampus);

		var host = $("#" + lastFinderId);
		host.empty();
		host.append("<ul id='similarlocations' data-role='listview' data-icon='arrow-darkblue' style='padding-left:16px; margin-bottom:5px;margin-top:5px;'></ul>");
		host.append("<button data-theme='a' onclick='require([\"modules/sitemap\"], function(Sitemap) { new Sitemap().sitemapReset(); });'>Zurück</button>");
		host.trigger("create");

		var similars = similarHouses.concat(similarDescriptions);
		similars = _.uniq(similars, false, function(item) {
			if (item && item.geo && item.geo.properties)
				return item.geo.properties.id;
			else
				return item.data;
		});

		_.each(similars, function(item) {
			$("#similarlocations").append("<li><a onclick='require([\"modules/sitemap\"], function(Sitemap) { new Sitemap().sitemapNavigateTo(\"" + item.geo.properties.id + "\"); });'>" + item.geo.properties.Name + " (" + item.campus + ")</a></li>");
		});

		$("#similarlocations").listview("refresh");
	}

	function sitemapReset() {
		$("div[data-role='campusmenu']").campusmenu("changeTo", lastCampus);
	}

	function sitemapNavigateTo(id) {
		var entry = geo.findEntryById(id);
		$("div[data-role='campusmenu']").campusmenu("changeTo", entry.campus, entry.geo.properties.Name);
	}

	$(document).on("pageinit", "#sitemap", function() {
		geo.loadAllOnce();
	});

	var SearchView = Backbone.View.extend({

		initialize: function(options) {
			this.query = options.query;
			this.children = options.children;
		},

		setSearchValue: function(search, updateView) {
			$(this.query).val(search);
			if (updateView) {
				$(this.query).trigger("keyup");
			}
		},

		hideAllItems: function() {
			var host = $(this.children);
			$("li", host).removeClass("ui-first-child").remove("ui-last-child").addClass("ui-screen-hidden");
		}
	});

	var GeoBlock = Backbone.Model.extend({

		initialize: function() {
			this.insertId(this.get("geo"));
		},

		/**
		 * Inserts IDs into the properties objects of the given parameter.
		 *
		 * The expected structure is:
		 * "geo": {
		 *     features: [ {
		 *         "properties": {
		 *             "Name": ...,
		 *             "description": ...
		 *         }
		 *     } ]
		 * }
		 */
		insertId: function(geo) {
			_.each(geo.features, function(feature) {
				feature.properties.id = _.uniqueId();
			});
		},
	});

	var GeoCollection = Backbone.Collection.extend({

		model: GeoBlock,

		initialize: function() {
			// Workaround for overwriting of "this"
			this.loadSuccess = _.bind(this.loaded, this);
			this.loadFail = _.bind(this.failed, this);
		},

		loadAll: function() {
			console.log("executing GeoCollection.loadAll()");
			return Q.fcall(this.callAjax)
					.then(this.loadSuccess)
					.fail(this.loadFail);
		},

		callAjax: function() {
			var url = "js/geojson/campus-geo.json";

			var d = Q.defer();
			$.getJSON(url).done(d.resolve).fail(d.reject);
			return d.promise;
		},

		loadAllOnce: function() {
			if (this.loadAllOncePromise == undefined) {
				this.loadAllOncePromise = this.loadAll();
			}
			return this.loadAllOncePromise;
		},

		loaded: function(result) {
			this.add(result);
		},

		failed: function(error) {
			var errorPage = new utils.ErrorView({el: '#error-placeholder', msg: 'Die Daten konnten nicht geladen werden.', module:'sitemap', err: error});
		}
	});

	var SearchableGeoCollection = GeoCollection.extend({

		findHouseNumberOnOtherCampuses: function(house, currentCampus) {
			return this.chain()
						.filter(function(item) { return item.get("campus").toLowerCase() != currentCampus.toLowerCase(); })
						.map(function(item) {
							return _.chain(item.get("geo").features)
									.filter(function(feature) { return feature.properties.Name == house; })
									.map(function(feature) { return _.extend(_.clone(item.attributes), {geo: feature}); })
									.value();
						})
						.flatten()
						.value();
		},

		findDescriptionOnOtherCampuses: function(search, currentCampus) {
			return this.chain()
						.filter(function(item) { return item.get("campus").toLowerCase() != currentCampus.toLowerCase(); })
						.map(function(item) {
							return _.chain(item.get("geo").features)
									.filter(function(feature) { return (feature.properties.description || "").indexOf(search) !== -1; })
									.map(function(feature) { return _.extend(_.clone(item.attributes), {geo: feature}); })
									.value();
						})
						.flatten()
						.value();
		},

		findEntryById: function(id) {
			return this.chain()
						.map(function(item) {
							return _.chain(item.get("geo").features)
									.filter(function(feature) { return feature.properties.id == id; })
									.map(function(feature) { return _.extend(_.clone(item.attributes), {geo: feature}); })
									.value();
						})
						.flatten()
						.first()
						.value();
		}
	});

	var geo = new SearchableGeoCollection();

	var SitemapPageView = Backbone.View.extend({
		attributes: {"id": 'sitemap'},

		initialize: function(){
			this.template = utils.rendertmpl('sitemap');
		},

		render: function(){
			$(this.el).html(this.template({}));
			return this;
		},

		searchSimilarLocations: function(id) {
			searchSimilarLocations(id);
		},

		sitemapReset: function() {
			sitemapReset();
		},

		sitemapNavigateTo: function(id) {
			sitemapNavigateTo(id);
		}
	});

	return SitemapPageView;
});
