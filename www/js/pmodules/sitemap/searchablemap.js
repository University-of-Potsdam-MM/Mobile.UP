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

	var SearchableMarker = Backbone.Model.extend({

		createMarker: function(map, categoryStore) {
			var m = this.attributes;

			m.options.zIndex = 2;
			var gMarkers = new GeoJSON(m.geo, m.options, map, m.hasSimilarsCallback);
			var bMarkers = new GeoJSON(this._shadowOfContext(m.geo), this._shadowOfOptions(m.options), map, m.hasSimilarsCallback);

			if (gMarkers.error) {
				console.log(gMarkers.error);
			} else if (bMarkers.error) {
				console.log(bMarkers.error);
			} else {
				var gMarker = new CategoryMarker(gMarkers[0], map, m.category, categoryStore, bMarkers[0]);
				gMarker.reset();

				this.set("marker", gMarker);
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
		}
	});

	var SearchableMarkerCollection2 = Backbone.Collection.extend({
		model: SearchableMarker,
		mode: SHOW_MODE,

		switchMode: function(targetMode) {
			if (this.mode === targetMode) {
				return;
			}

			switch (targetMode) {
				case SEARCH_MODE:
					// Don't show all markers, only the matching one
					this.each(function(element) {
						element.get("marker").setVisibility(false, true);
					});
					break;
				case SHOW_MODE:
					// Show all markers
					this.each(function(element) {
						element.get("marker").reset();
					});
					break;
			}

			this.mode = targetMode;
		}
	});

	var MapFragment = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl("map_fragment");

			// When window resizing resize map
			$(window).resize(_.bind(function(){ this.resizeMap(true); }, this));
		},

		/**
		 * draws the initial map and centers on the given coordinate
		 * @param center an object of google maps latlng object
		 */
		createMap: function(center) {
			var myOptions = {
				zoom: 16,
				center: center,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			this._map = new google.maps.Map(this.$("#map-canvas")[0], myOptions);
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

	var SearchView = Backbone.View.extend({

		setSearchValue: function(search, updateView) {
			this.$("input[data-type='search']").val(search);
			if (updateView) {
				this.$("input[data-type='search']").trigger("keyup");
			}
		},

		hideAllItems: function() {
			this.$("#filterable-locations li").removeClass("ui-first-child").remove("ui-last-child").addClass("ui-screen-hidden");
		}
	});

	$.widget("up.searchablemap", {
		options: {
			categoryStore: undefined
		},

		_markerCollection: undefined,
		_mapView: undefined,
		_searchView: undefined,

		_create: function() {
			this._mapView = new MapFragment();
			// create html code
			this.element.append(this._mapView.render().$el);
			this.element.trigger("create");

			// Initialize filter
			this.element.find("#filterable-locations").filterable("option", "filterCallback", _.partial(this._filterLocations, this));

			this.element.on("click", "#filterable-locations a", _.bind(function (ev) {
				ev.preventDefault();

				// Retreive context
				var source = $(ev.currentTarget);
				var markerId = source.attr("data-id");

				var marker = this._markerCollection.get(markerId);
				this._showMarker(marker.get("marker"));
				this._onSelected(marker.get("name"));
			}, this));

			this._searchView = new SearchView({el: this.element});
		},

		_onSelected: function(selection) {
			this._searchView.setSearchValue(selection);
			this._searchView.hideAllItems();
		},

		_showMarker: function(selectedMarker) {
			// Hide all markers
			this._markerCollection.each(function(tmpMarker) {
				tmpMarker.get("marker").setVisibility(false, true);
			});

			// Show the selected marker
			selectedMarker.setVisibility(true, true);
			selectedMarker.centerOnMap();
			selectedMarker.openInfoWindow();
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
			this._mapView.createMap(center);
			this._markerCollection = new SearchableMarkerCollection2();
		},

		_insertSearchables: function(searchables) {
			var createSearchables = rendertmpl("sitemap_detail");
			var host = this.element.find("#filterable-locations");

			// Add items to search list
			var htmlSearch = createSearchables({items: searchables.toJSON()});
			host.append(htmlSearch);

			// Tell search list to refresh itself
			host.listview("refresh");
			host.trigger("updatelayout");
		},

		insertSFC: function(collection) {
			var items = collection.toJSON();
			_.each(items, function(item, index) {
				item.index = index;
			}, this);
			this._markerCollection.reset(items);

			this._insertSearchables(this._markerCollection);
			this._insertMapsMarkers(this._markerCollection);
		},

		viewByName: function(name) {
			this._searchView.setSearchValue(name);
			var first = this._markerCollection.find(function(marker) { return marker.get("name") === name; });
			this._showMarker(first.get("marker"));
		},

		resetAllMarkers: function() {
			this._markerCollection.each(function(a) {
				a.get("marker").reset();
			});
		},

		_filterLocations: function(widgetHost, index, searchValue) {
			var text = $(this).text();
			var result = text.toLowerCase().indexOf(searchValue) === -1;

			if (searchValue) {
				widgetHost._markerCollection.switchMode(SEARCH_MODE);

				// Don't show all markers, only the matching one
				var source = $("a", this);
				var markerId = source.attr("data-id");
				var marker = widgetHost._markerCollection.get(markerId).get("marker");
				if (!result) {
					marker.setVisibility(true, true);
				} else {
					marker.setVisibility(false, true);
				}
			} else {
				widgetHost._markerCollection.switchMode(SHOW_MODE);
			}

			return result;
		},

		_insertMapsMarkers: function(items) {
			items.each(function(item) {
				item.createMarker(this._mapView._map, this.options.categoryStore);
			}, this);
		}
	});
});