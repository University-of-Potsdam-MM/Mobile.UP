define(['jquery', 'underscore', 'backbone', 'utils', 'geojson'], function($, _, Backbone, utils, GeoJSON){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/sitemap");

	var CategoryMarker = function (marker, map, category, categoryStore, markerShadow) {

		this.setVisibility = function(show, overrideCategory) {
			if (typeof(overrideCategory)==='undefined') overrideCategory = false;

			if (show && overrideCategory) {
				marker.setMap(map);
				markerShadow.setMap(map);
			} else if (show && !overrideCategory && categoryStore.isVisible(category)) {
				marker.setMap(map);
				markerShadow.setMap(null);
			} else {
				marker.setMap(null);
				markerShadow.setMap(null);
			}
		};

		this.reset = function() {
			markerShadow.setMap(null);

			if (categoryStore.isVisible(category)) {
				marker.setMap(map);
			} else {
				marker.setMap(null);
			}
		};

		this.openInfoWindow = function() {
			marker.info.open(map);
		};

		this.centerOnMap = function() {
			// Get the selected item into view. Tested for Polygon and Marker.
			var bounds = new google.maps.LatLngBounds();
			if (marker.getPath) {
				marker.getPath().forEach(function(latLng) {
					bounds.extend(latLng);
				});
			} else if (marker.getPosition) {
				bounds.extend(marker.getPosition());
			}

			// Keep the current zoom level
			var oldZoom = map.getZoom();
			map.fitBounds(bounds);
			var newZoom = map.getZoom();
			if (oldZoom < newZoom) {
				map.setZoom(oldZoom);
			}
		};
	};

	var SEARCH_MODE = 0;
	var SHOW_MODE = 1;

	var SearchableMarkerCollection = function() {

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
	};

	var MapFragment = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl("map_fragment");

			// When window resizing resize map
			$(window).resize(_.bind(function(){ this.resizeMap(true); }, this));
		},

		resizeMap: function(triggerMapsResizeEvent) {
			var iosStatusBarHeight = $.os.ios7 ? 25 : 0;
			this.$("#map-canvas").css("height", $(window).height() - 165 - iosStatusBarHeight);

			// Resize map, but keeper current center?
			if (triggerMapsResizeEvent && this._map) {
				var center = this._map.getCenter();
				google.maps.event.trigger(this._map, 'resize');
				this._map.setCenter(center);
			}
		},

		render: function() {
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			this.resizeMap(false);
			return this;
		}
	});

	$.widget("up.searchablemap", {
		options: {
			onSelected: function(selection) {},
			categoryStore: undefined
		},

		_markers: undefined,
		_allMarkers: undefined,
		_mapView: undefined,

		_create: function() {
			this._mapView = new MapFragment();
			// create html code
			this.element.append(this._mapView.render().$el);
			this.element.trigger("create");

			// Initialize filter
			$("#filterable-locations").filterable("option", "filterCallback", this._filterLocations);

			$(document).on("click", "#filterable-locations a", _.bind(function (ev) {
				ev.preventDefault();

				// Retreive context
				var source = $(this);
				var href = source.attr("data-tag");
				var index = parseInt(href);

				this._showIndex(index);
				this.options.onSelected(this._markers[index].context.features[0].properties.Name);
			}, this));
		},

		_showIndex: function(index) {
			// Hide all markers
			var tmpMarkers = allMarkers.getElements();
			for (var i = 0; i < tmpMarkers.length; i++) {
				tmpMarkers[i].setVisibility(false, true);
			}

			// Show the selected marker
			tmpMarkers[index].setVisibility(true, true);
			tmpMarkers[index].centerOnMap();
			tmpMarkers[index].openInfoWindow();
		},

		_destroy: function() {
			this.element.children().last().remove();
		},

		_setOption: function(key, value) {
			this._super(key, value);
		},

		pageshow: function(center) {
			this._initializeMap(center);
		},

		/**
		 * initializes the map and draws all markers which are currently selected
		 */
		_initializeMap: function(center) {
			this._drawMap(center);
			this._markers = [];
			allMarkers = new SearchableMarkerCollection();
		},

		/**
		 * draws the initial map and centers on the given coordinate
		 * @param {latlng} an object of google maps latlng object
		 */
		_drawMap: function(latlng) {
			var myOptions = {
					zoom: 16,
					center: latlng,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
			this._mapView._map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
		},

		_insertSearchables: function(searchables) {
			var createSearchables = rendertmpl("sitemap_detail");
			var host = $("#filterable-locations");

			// Add items to search list
			var htmlSearch = createSearchables({items: searchables});
			host.append(htmlSearch);

			// Tell search list to refresh itself
			host.listview("refresh");
			host.trigger("updatelayout");
		},

		insertSearchableFeatureCollectionObject: function(model) {
			this.insertSearchableFeatureCollection(model.get("displayOptions"), model.get("featureCollection"), model.get("category"), model.get("hasSimilarsCallback"));
		},

		insertSearchableFeatureCollection: function(options, collection, category, hasSimilarsCallback) {
			var widgetHost = this;
			var items = _.map(collection.features, function(item) {
				var result = {};
				result.name = item.properties.Name;
				result.description = item.properties.description;

				// Save item context
				var context = JSON.parse(JSON.stringify(collection));
				context.features = [item];

				// Save marker and get its index
				result.index = widgetHost._saveMarker(options, context, category);

				return result;
			});

			this._insertSearchables(items);
			this._insertMapsMarkers(items, hasSimilarsCallback);
		},

		viewByName: function(name) {
			var first = _.chain(this._markers)
							.filter(function(marker) { return marker.context.features[0].properties.Name === name; })
							.first()
							.value();
			var index = _.indexOf(this._markers, first);
			this._showIndex(index);
		},

		_filterLocations: function(index, searchValue) {
			var text = $(this).text();
			var result = text.toLowerCase().indexOf(searchValue) === -1;

			if (searchValue) {
				allMarkers.switchMode(SEARCH_MODE);

				// Don't show all markers, only the matching one
				var source = $("a", this);
				var href = source.attr("data-tag");
				var index = parseInt(href);
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
		},

		_insertMapsMarkers: function(items, hasSimilarsCallback) {
			for (var i in items) {
				var m = this._loadMarker(items[i].index);

				m.options.zIndex = 2;
				var gMarkers = new GeoJSON(m.context, m.options, this._mapView._map, hasSimilarsCallback);
				var bMarkers = new GeoJSON(this._shadowOfContext(m.context), this._shadowOfOptions(m.options), this._mapView._map, hasSimilarsCallback);

				if (gMarkers.error) {
					console.log(gMarkers.error);
				} else if (bMarkers.error) {
					console.log(bMarkers.error);
				} else {
					var gMarker = new CategoryMarker(gMarkers[0], this._mapView._map, m.category, this.options.categoryStore, bMarkers[0]);
					gMarker.reset();

					var tmpMarkers = allMarkers.getElements();
					tmpMarkers[items[i].index] = gMarker;
				}
			}
		},

		_shadowOfContext: function(context) {
			context = JSON.parse(JSON.stringify(context));
			context.properties = {};
			return context;
		},

		_shadowOfOptions: function(options) {
			options = JSON.parse(JSON.stringify(options));
			options.strokeColor = "#000000";
			options.strokeOpacity = 0.3;
			options.strokeWeight = 20;
			options.fillColor = "#000000";
			options.fillOpacity = 0.5;
			options.zIndex = -1;
			return options;
		},

		_saveMarker: function(options, context, category) {
			this._markers.push({options: options, context: context, category: category});
			return this._markers.length - 1;
		},

		_loadMarker: function(index) {
			return this._markers[index];
		}
	});
});