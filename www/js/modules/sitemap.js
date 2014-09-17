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
	
	/**
	 * Prevents a given callback from getting called while a block is enabled. After the block is lifted, the callback gets called if its call was blocked earlier.
	 */
	var oneSidedGuard = {
		callback: function(options) { mapHelper.drawSelectedCampus(options); },
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
			var errorPage = new utils.ErrorView({el: '#error-placeholder', msg: 'Es besteht keine Internetverbindung.', module:'sitemap'});
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
	
	var MapHelper = Backbone.View.extend({
		
		drawSelectedCampus: function(options) {
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

			Q(this.clearMenu(uniqueDivId))
				.then(function() { return geo.loadAllOnce(); })
				.then(function() { mapHelper.drawCampus(uniqueDivId, campus); })
				.then(function() { mapHelper.setSearchValue(search); })
				.fail(function (error) {
					var errorPage = new utils.ErrorView({el: '#error-placeholder', msg: 'Es ist ein unerwarteter Fehler aufgetreten.', module:'sitemap', err: error});
				});
		},
		
		clearMenu: function(uniqueDivId) {
			$("#currentCampus").empty();
			$("#currentCampus").append("<div id=\"" + uniqueDivId + "\"></div>");
		},
		
		setSearchValue: function(search) {
			if (search !== undefined) {
				searchView.setSearchValue(search);
				$("div[data-role='searchablemap']").searchablemap("viewByName", search);
			}
		},
		
		drawCampus: function(uniqueDiv, url) {
			var host = $("#" + uniqueDiv);
			host.append("<div data-role='searchablemap'></div>");
			host.trigger("create");

			$("div[data-role='searchablemap']", host).searchablemap({ onSelected: this.onItemSelected, categoryStore: categoryStore });
			$("div[data-role='searchablemap']", host).searchablemap("pageshow", url.center);

			var data = geo.filter(function(element) { return element.get("campus") === url.campus; });

			this.getAndDrawGeoByCategory(data, settings.options.terminals, terminals, url.campus);
			this.getAndDrawGeoByCategory(data, settings.options.institutes, institutes, url.campus);
			this.getAndDrawGeoByCategory(data, settings.options.canteens, canteens, url.campus);
			this.getAndDrawGeoByCategory(data, settings.options.parking, parking, url.campus);
			this.getAndDrawGeoByCategory(data, settings.options.associateinstitutes, associateinstitutes, url.campus);
			this.getAndDrawGeoByCategory(data, settings.options.student, student, url.campus);
		},
		
		getAndDrawGeoByCategory: function(data, options, category, campus) {
			var result = _.chain(data)
						.filter(function(element) { return element.get("category") === category; })
						.first()
						.value();
			
			var foundData = undefined
			if (result) {
				foundData = result.get("geo");
			}
			
			if (foundData) {
				$("div[data-role='searchablemap']").searchablemap("insertSearchableFeatureCollection", options, foundData, category, similarHelper.hasSimilarLocations(campus));
			}
		},
		
		onItemSelected: function(selection) {
			searchView.setSearchValue(selection);
			searchView.hideAllItems();
		}
	});
	
	var SimilarHelper = Backbone.View.extend({
		
		hasSimilarLocations: function(campus) {
			return function(id) {
				var entry = geo.findEntryById(id);
				var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.geo.properties.Name, campus);
				var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.geo.properties.description, campus);

				return similarHouses.length + similarDescriptions.length > 0;
			};
		},
		
		searchSimilarLocations: function(id) {
			var entry = geo.findEntryById(id);
			var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.geo.properties.Name, lastCampus);
			var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.geo.properties.description, lastCampus);

			var host = $("#" + lastFinderId);
			host.empty();
			host.append("<ul id='similarlocations' data-role='listview' data-icon='arrow-darkblue' style='padding-left:16px; margin-bottom:5px;margin-top:5px;'></ul>");
			host.append("<button data-theme='a' onclick='require([\"modules/sitemap\"], function(Sitemap) { new Sitemap().sitemapReset(); });'>Zurück</button>");
			host.trigger("create");

			var similars = similarHouses.concat(similarDescriptions);
			similars = _.uniq(similars, false, function(item) { return item.data; });

			_.each(similars, function(item) {
				$("#similarlocations").append("<li><a onclick='require([\"modules/sitemap\"], function(Sitemap) { new Sitemap().sitemapNavigateTo(\"" + item.geo.properties.id + "\"); });'>" + item.geo.properties.Name + " (" + item.campus + ")</a></li>");
			});

			$("#similarlocations").listview("refresh");
		}
	});
	
	var mapHelper = new MapHelper;
	var similarHelper = new SimilarHelper;

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
			this.loadAllPromise = Q.defer();
			this.url = "js/geojson/campus-geo.json";
			this.listenTo(this, "sync", this.synced)
			this.listenTo(this, "error", this.failed);
			
			this.loadAllOnce = _.once(this.loadAll);
		},

		loadAll: function() {
			console.log("executing GeoCollection.loadAll()");
			this.fetch({reset: true});
			return this.loadAllPromise;
		},
		
		synced: function() {
			this.loadAllPromise.resolve(this);
		},

		failed: function(error) {
			this.loadAllPromise.reject(new Error("Die Daten konnten nicht geladen werden"));
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
			similarHelper.searchSimilarLocations(id);
		},
		
		sitemapReset: function() {
			$("div[data-role='campusmenu']").campusmenu("changeTo", lastCampus);
		},
		
		sitemapNavigateTo: function(id) {
			var entry = geo.findEntryById(id);
			$("div[data-role='campusmenu']").campusmenu("changeTo", entry.campus, entry.geo.properties.Name);
		}
	});

	return SitemapPageView;
});
