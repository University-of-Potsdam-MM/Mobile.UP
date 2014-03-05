$(function() {
	$.widget("up.campusmenu", {
		options: {
			onChange: function(name) {},
			store: "campusmenu.default"
		},
		
		_create: function() {
			// create html code
			this.element.append(
				"<div data-role='navbar'> \
                    <ul> \
                        <li><a href='#Griebnitzsee' class='location-menu location-menu-default'>Griebnitzsee</a></li> \
                        <li><a href='#NeuesPalais' class='location-menu'>Neues Palais</a></li> \
                        <li><a href='#Golm' class='location-menu'>Golm</a></li> \
                    </ul> \
                </div>");
			this.element.trigger("create");
			
			// read local storage
			this.options.store = this.element.attr("data-store");
			
			// bind to click events
			var widgetParent = this;
			$(".location-menu", this.element).bind("click", function (event) {
				var source = $(this);
				
				// call onChange callback
				var target = widgetParent._retreiveSelection(source);
				widgetParent._setDefaultSelection(target);
				widgetParent.options.onChange(target);
				
				// For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
				widgetParent._fixActiveTab(source, event);
			});
		},
		
		_destroy: function() {
			this.element.children().last().remove();
		},
		
		pageshow: function() {
			var selection = this._activateDefaultSelection();
			this.options.onChange(selection);
		},
		
		_setOption: function(key, value) {
			this._super(key, value);
		},
		
		_setDefaultSelection: function(selection) {
			localStorage.setItem(this.options.store, selection);
		},
		
		_getDefaultSelection: function() {
			return localStorage.getItem(this.options.store);
		},
		
		_retreiveSelection: function(selectionSource) {
			return selectionSource.attr("href").slice(1);
		},
		
		_activateDefaultSelection: function() {
			var defaultSelection = this._getDefaultSelection();
			
			if (!defaultSelection) {
				var source = $(".location-menu-default")
				defaultSelection = this._retreiveSelection(source);
				this._setDefaultSelection(defaultMensa);
			}
			
			$(".location-menu", this.element).removeClass("ui-btn-active");
			var searchExpression = "a[href='#" + defaultSelection + "']";
			$(searchExpression).addClass("ui-btn-active");
			
			return defaultSelection;
		},
		
		_fixActiveTab: function(target, event) {
			event.preventDefault();
			$(".location-menu", this.element).removeClass("ui-btn-active");
			target.addClass("ui-btn-active");
		},
		
		getActive: function() {
			return this._retreiveSelection($(".ui-btn-active"));
		}
	});
	
	$.widget("up.searchablemap", {
		options: {
			onSelected: function(selection) {}
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
					<!-- map loads here... --> \
					<div id='map-canvas' class='gmap3' style='height: 300px;'></div> \
				</div>");
			this.element.trigger("create");
			
			// Initialize filter
			$("#filterable-locations").filterable("option", "filterCallback", this._filterLocations);
			
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
		},
		
		_destroy: function() {
			this.element.children().last().remove();
		},
		
		_setOption: function(key, value) {
			this._super(key, value);
		},
		
		pageshow: function() {
			this._initializeMap(settings.url.griebnitzsee.center);
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
			var createSearchables = render("sitemap");
			var host = $("#filterable-locations");
			
			// Add items to search list
			var htmlSearch = createSearchables({items: searchables});
			host.append(htmlSearch);
			
			// Tell search list to refresh itself
			host.listview("refresh");
			host.trigger("updatelayout");
		},
		
		insertSearchableFeatureCollection: function(options, collection, category) {
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
			this._insertMapsMarkers(items);
		},
		
		addItems: function(items) {
		},
		
		eachMarker: function(callback) {
		},
		
		_filterLocations: function(index, searchValue) {
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
		},
		
		_insertMapsMarkers: function(items) {
			for (var i in items) {
				var m = this._loadMarker(items[i].index);
				var gMarkers = new GeoJSON(m.context, m.options);
				
				if (gMarkers.error) {
					console.log(gMarkers.error);
				} else {
					var gMarker = new CategoryMarker(gMarkers[0], this._map, m.category, categoryStore);
					gMarker.reset();
					
					var tmpMarkers = allMarkers.getElements();
					tmpMarkers[items[i].index] = gMarker;
				}
			}
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
