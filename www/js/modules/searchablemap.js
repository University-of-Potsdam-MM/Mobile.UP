define(['jquery', 'underscore', 'backbone', 'utils', 'geojson'], function($, _, Backbone, utils, GeoJSON){

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


	$.widget("up.searchablemap", {
		options: {
			onSelected: function(selection) {},
			categoryStore: undefined
		},

		_map: undefined,
		_markers: undefined,
		_allMarkers: undefined,

		_create: function() {
			// create html code
			this.element.append(
				"<div> \
					<ul id='filterable-locations' data-role='listview' data-filter='true' data-filter-reveal='true' data-filter-placeholder='Suchbegriff eingeben...' data-inset='true'></ul> \
					<div class='ui-controlgroup ui-controlgroup-vertical ui-corner-all' data-role='controlgroup' data-filter='true' data-input='#filterable-locations' data-filter-reveal='true' data-enhanced='true'> \
						<div class='ui-controlgroup-controls'></div> \
					</div> \
					<div id='error-placeholder'></div> \
					<!-- map loads here... --> \
					<div id='map-canvas' class='gmap3'></div> \
				</div>");
			this.element.trigger("create");
			$('#map-canvas').css("height",$(window).height()-165);

			// Initialize filter
			$("#filterable-locations").filterable("option", "filterCallback", this._filterLocations);

			var widgetHost = this;
			$(document).on("click", "#filterable-locations a", function () {
				// Retreive context
				var source = $(this);
				var href = source.attr("data-tag");
				var index = parseInt(href);

				widgetHost._showIndex(index);
				widgetHost.options.onSelected(widgetHost._markers[index].context.features[0].properties.Name);
			});

			// when window resizing set new center and resize map
			$(window).resize(function(){
				$('#map-canvas').css("height",$(window).height()-165);
		        var center = widgetHost._map.getCenter();
		        google.maps.event.trigger(widgetHost._map, 'resize');
		        widgetHost._map.setCenter(center);
		   });
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
			this._map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
		},

		_insertSearchables: function(searchables) {
			var createSearchables = utils.rendertmpl("sitemap_detail");
			var host = $("#filterable-locations");

			// Add items to search list
			var htmlSearch = createSearchables({items: searchables});
			host.append(htmlSearch);

			// Tell search list to refresh itself
			host.listview("refresh");
			host.trigger("updatelayout");
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
				var gMarkers = new GeoJSON(m.context, m.options, this._map, hasSimilarsCallback);
				var bMarkers = this._shadowOf(m.context, m.options, this._map, hasSimilarsCallback);

				if (gMarkers.error) {
					console.log(gMarkers.error);
				} else if (bMarkers.error) {
					console.log(bMarkers.error);
				} else {
					var gMarker = new CategoryMarker(gMarkers[0], this._map, m.category, this.options.categoryStore, bMarkers[0]);
					gMarker.reset();

					var tmpMarkers = allMarkers.getElements();
					tmpMarkers[items[i].index] = gMarker;
				}
			}
		},

		_shadowOf: function(context, options, map, hasSimilarsCallback) {
			context = JSON.parse(JSON.stringify(context));
			context.properties = {};

			options = JSON.parse(JSON.stringify(options));
			options.strokeColor = "#000000";
			options.strokeOpacity = 0.3;
			options.strokeWeight = 20;
			options.fillColor = "#000000";
			options.fillOpacity = 0.5;
			options.zIndex = -1;

			return new GeoJSON(context, options, map, hasSimilarsCallback);
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