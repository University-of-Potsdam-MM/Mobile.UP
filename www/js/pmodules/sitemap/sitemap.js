define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'modules/campusmenu',
	'modules/timeselection',
	'pmodules/sitemap/sitemap.models',
	'pmodules/sitemap/searchablemap',
	'./settings'
], function($, _, Backbone, utils, campusmenu, timeselection, models, searchablemap, settings) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/sitemap");

	var terminals = "terminals";
	var institutes = "institutes";
	var canteens = "canteens";
	var parking = "parking";
	var associateinstitutes = "associateinstitutes";
	var student = "student";
	var sport = "sport";

	var categoryStore = new CategoryStore();
	var lastFinderId = undefined;
	var lastCampus = undefined;

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

	function checkUncheck(category) {
		return function() {
			var visibility = $(this).is(':checked');
			categoryStore.setVisibility(category, visibility);
			$("div[data-role='searchablemap']").searchablemap("resetAllMarkers");
		};
	}

	function initPanelAndColors() {
		$('#Terminals:checkbox').click(checkUncheck(terminals));
		$('#Institute:checkbox').click(checkUncheck(institutes));
		$('#Mensen:checkbox').click(checkUncheck(canteens));
		$('#Parking:checkbox').click(checkUncheck(parking));
		$('#AnInstitute:checkbox').click(checkUncheck(associateinstitutes));
		$('#Living:checkbox').click(checkUncheck(student));
		$('#Sport:checkbox').click(checkUncheck(sport));

		settings.initColors();
	}

	var CampusMapView = Backbone.View.extend({

		initialize: function () {
			this.listenToOnce(this.collection, "sync", this.render);
			this.listenTo(this.collection, "error", this.fetchFailed);
			this.collection.fetch();
		},

		fetchFailed: function(error) {
			new utils.ErrorView({el: '#error-placeholder', msg: 'Die Daten konnten nicht geladen werden.', module:'sitemap', err: error});
		},

		render: function() {
			var url = this.model.get("campus");

			this.$el.append("<div data-role='searchablemap'></div>");
			this.$el.trigger("create");

			this.$("div[data-role='searchablemap']").searchablemap({ categoryStore: categoryStore });
			this.$("div[data-role='searchablemap']").searchablemap("pageshow", url.center);

			// Add map objects
			this.$("div[data-role='searchablemap']").searchablemap("insertSFC", this.collection);

			// Set search value
			var search = this.model.get("search");
			if (search !== undefined) {
				$("div[data-role='searchablemap']").searchablemap("viewByName", search);
			}
		}
	});

	function drawSelectedCampus(options) {
		var uniqueDivId = _.uniqueId("id_");
		clearMenu(uniqueDivId);

		lastFinderId = uniqueDivId;
		lastCampus = options.campusName;

		var data = createCampusMapCollection(options);
		var model = data.model;
		var collection = data.collection;
		new CampusMapView({el: $("#" + uniqueDivId), collection: collection, model: model});
	}

	/**
	 * @param options.campusName
	 * @param options.meta
	 */
	function createCampusMapCollection(options) {
		var model = new models.Campus({
			campus: settings.getCampus(options.campusName),
			search: options.meta
		});
		var collection = new models.CampusMapCollection([], {
			geo: geo,
			campus: model.get("campus").campus,
			settings: settings
		});
		return {model: model, collection: collection};
	}

	function clearMenu(uniqueDivId) {
		$("#currentCampus").empty().append("<div id=\"" + uniqueDivId + "\"></div>");
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

	app.views.SitemapSimilars = Backbone.View.extend({

		events: {
			"click .similar-location": "navigateTo"
		},

		initialize: function(options) {
			this.template = rendertmpl("sitemap_similar_locations");

			var id = options.locationId;

			if (geo.isEmpty()) {
				geo.fetch({
					success: _.bind(function() { this._renderSimilarLocations(id); }, this),
					error: function() { alert("Fehler beim Laden der Daten"); }
				});
			} else {
				this._renderSimilarLocations(id);
			}
		},

		_renderSimilarLocations: function(id) {
			this.collection = new Backbone.Collection(geo.get(id).findSimilarLocations());
			this.render();
		},

		navigateTo: function(ev) {
			ev.preventDefault();
			var itemId = $(ev.currentTarget).attr("data-tag");

			var entry = geo.get(itemId);
			var campus = entry.get("campus");
			var name = entry.get("name");
			app.route("#sitemap/changeto/" + encodeURIComponent(campus) + "/" + encodeURIComponent(name));
		},

		render: function() {
			this.$el.empty();
			if (this.collection) {
				this.$el.append(this.template({similars: this.collection.toJSON()}));
			} else {
				this.$el.append(this.template({similars: undefined}));
			}
			this.$el.trigger("create");

			if (this.page) {
				this.page.empty();
				this.page.append(this.$el);
			}
		}
	});

	var geo = new models.SearchableGeoCollection();

	app.views.SitemapIndex = Backbone.View.extend({

		initialize: function(options){
			this.template = rendertmpl('sitemap');
			this._loadMap();

			if (options.campus && options.buildingName) {
				this.changeOptions = {
					campus: options.campus,
					name: options.buildingName
				};
			}
		},

		_loadMap: function() {
			$.getScript('https://www.google.com/jsapi').done(function(){
				google.load('maps', '3', {callback: function(){
					oneSidedGuard.disableBlock();
				}});
			}).fail(function(){
				new utils.ErrorView({el: '#error-placeholder', msg: 'Es ist ein Fehler aufgetreten, wahrscheinlich besteht keine Internetverbindung.', module:'sitemap'});
			});
		},

		render: function(){
			this.$el = this.page;
			this.$el.html(this.template({}));
			$("div[data-role='campusmenu']").campusmenu({ onChange: function(options) { oneSidedGuard.callMultiple(options); } }).campusmenu("pageshow");
			$('#sitemaps-settings').panel().trigger('create');

			initPanelAndColors();

			if (this.changeOptions) {
				$("div[data-role='campusmenu']").campusmenu("changeTo", this.changeOptions.campus, this.changeOptions.name);
				delete this.changeOptions;
			}

			return this;
		},

		afterRender: function(){
			$('#header-settings-btn').click(function(){
				$('#sitemaps-settings').panel("toggle");
			});
		}
	});


	app.views.SitemapPage = Backbone.View.extend({
		attributes: {"id": 'sitemap'},

		initialize: function(){
		},

		render: function(){
			$(this.el).html('');
			return this;
		}
	});

	return app.views; //SitemapPageView;
});
