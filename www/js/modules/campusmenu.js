define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'pmodules/sitemap/settings',
	'turf',
	'jquerymobile'
], function($, _, Backbone, utils, settings, turf) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/modules");

	var TabModel = Backbone.Model.extend({

		defaults: {
			locations: [
				{ id: "griebnitzsee", name: "Griebnitzsee" },
				{ id: "neuespalais", name: "Neues Palais" },
				{ id: "golm", name: "Golm" }
			],
			activeLocation: "up.mensa.default"
		},

		setItem: function(selection) {
			localStorage.setItem(this.get("activeLocation"), selection);
		},

		getItem: function() {
			var result = localStorage.getItem(this.get("activeLocation"));
			return result || this.get("locations")[0].id;
		}
	});

	/**
	 * Uses the jQuery UI tabs widget. Documentation at https://api.jqueryui.com/tabs/
	 */
	var TabView = Backbone.View.extend({

		events: {
			"click .tabs-content-links": "tabClick"
		},

		initialize: function() {
			this.template = rendertmpl("campusmenu");
			this.model = this.model || new TabModel();
		},

		/**
		 * We want to prevent the url from changing, but in return we have to change the button color of the active tab ourselves.
		 */
		tabClick: function(ev) {
			ev.preventDefault();

			// Store new location
			var location = (ev.target.hash || "#").slice(1);
			this.model.setItem(location);

			// Change active tab button manually
			$(".ui-btn-active", ev.currentTarget).first().removeClass("ui-btn-active");
			$(ev.target).addClass("ui-btn-active");

			return false;
		},

		refresh: function() {
			this.$el.tabs().tabs("refresh");
		},

		_indexForLocation: function(location) {
			var result = _.chain(this.model.get("locations"))
				.map(function(l) { return l.id === location; })
				.indexOf(true)
				.value();
			return result < 0 ? 0 : result;
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({locations: this.model.get("locations")}));

			// Select stored tab
			var location = this.model.getItem();
			this.$("a[href=#" + location + "]").addClass("ui-btn-active");
			this.$(".tabs-content").tabs({ active: this._indexForLocation(location) });

			return this;
		}
	});

	$.widget("up.campusmenu", {
		options: {
			onChange: function(name) {}
		},

		_create: function() {
			var url = Backbone.history.fragment.split('/');
			url = url[0]+'/'+url[1];
			// create html code
			this.element.append(
				"<div class=\"ui-navbar\" data-role='navbar'> \
                    <ul class=\"ui-grid-b\"> \
                        <li class=\"ui-block-a\"><a rel='norout' href='#griebnitzsee' class='ui-btn-active location-menu location-menu-default'>Griebnitzsee</a></li> \
                        <li class=\"ui-block-b\"><a rel='norout' href='#neuespalais' class='location-menu'>Neues Palais</a></li> \
                        <li class=\"ui-block-c\"><a rel='norout' href='#golm' class='location-menu'>Golm</a></li> \
                    </ul> \
                </div>");
			this.element.trigger("create");

			// bind to click events
			var widgetParent = this;
			$(".location-menu", this.element).bind("click", function (event) {
				var source = $(this);
				var target = widgetParent._retrieveSelection(source);

				// call onChange callback
				widgetParent.options.onChange({ campusName: target });

				// For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
				widgetParent._fixActiveTab(source, event);
			});
		},

		_destroy: function() {
			this.element.children().last().remove();
		},

		pageshow: function(notrigger) {
			this._activateDefaultSelection(_.bind(function(selection) {
				if (!notrigger) {
					this.options.onChange({campusName: selection});
				}
			}, this));
		},

		_setOption: function(key, value) {
			this._super(key, value);
		},

		_getDefaultSelection: function(callback) {
			navigator.geolocation.getCurrentPosition(function(position) {
				// Position received
				var places = [
					settings.url.golm,
					settings.url.griebnitzsee,
					settings.url.neuespalais
				];

				var user = turf.point([position.coords.longitude, position.coords.latitude]);

				var nearestCampus = _.chain(places)
					// Calculate campus distances
					.map(function(place) {
						var center = turf.point([place.center.lng, place.center.lat]);

						return {
							campus: place.campus,
							distance: turf.distance(user, center, "kilometers")
						};
					})
					// Find minimum distance
					.min(function(place) { return place.distance; })
					// Get associated name
					.value().campus;

				callback(nearestCampus);
			}, function() {
				// No location available
				callback(undefined);
			});
		},

		_retrieveSelection: function(selectionSource) {
			return selectionSource.attr("href").slice(1);
		},

		_activateDefaultSelection: function(callback) {
			this._getDefaultSelection(_.bind(function(defaultSelection) {
				if (!defaultSelection) {
					var source = $(".location-menu-default", this.element);
					defaultSelection = this._retrieveSelection(source);
				}

				$(".location-menu", this.element).removeClass("ui-btn-active");
				var searchExpression = "a[href='#" + defaultSelection + "']";
				$(searchExpression, this.element).addClass("ui-btn-active");

				callback(defaultSelection);
			}, this));
		},

		_fixActiveTab: function(target, event) {
			event.preventDefault();
			$(".location-menu", this.element).removeClass("ui-btn-active");
			target.addClass("ui-btn-active");
		},

		getActive: function() {
			return this._retrieveSelection($(".ui-btn-active", this.element));
		},

		changeTo: function(campusName, meta) {
			var target = campusName;

			$(".location-menu", this.element).removeClass("ui-btn-active");
			var searchExpression = "a[href='#" + target + "']";
			$(searchExpression, this.element).addClass("ui-btn-active");

			// prepare call options
			var callOptions = { campusName: target };
			if (meta !== undefined) {
				callOptions.meta = meta;
			}

			// call onChange callback
			this.options.onChange(callOptions);
		}
	});

	return {
		TabView: TabView,
		TabModel: TabModel
	}
});