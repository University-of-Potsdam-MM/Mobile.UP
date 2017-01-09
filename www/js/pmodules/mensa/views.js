define(['jquery', 'underscore', 'backbone', 'utils', 'modules/campusmenu','datebox', 'view.utils'], function($, _, Backbone, utils, campusmenu, datebox, viewUtils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/mensa");

	var Menu = Backbone.Collection.extend({
		
		initialize: function(models, options) {
			this.location = options.location;
			this.date = options.date;
		},

		url: function() {
			var location = this.location;
			if (location == "griebnitzsee") {
				location = "Griebnitzsee";
			} else if (location == "neuespalais") {
				location = "NeuesPalais";
			} else if (location == "golm") {
				location = "Golm";
			} else if (location == "UlfsCafe") {
				location = "UlfsCafe";
			}
			return "https://api.uni-potsdam.de/endpoints/mensaAPI/1.0/readCurrentMeals?format=json&location=" + location;
		},
		
		parse: function(response) {
			// Map data format
			var date = this.date;
			var icons = response.readCurrentMealsResponse.meals.iconHashMap.entry;
			var meals = response.readCurrentMealsResponse.meals.meal;
			var mappedMeals = _.map(meals, this.mapToMeal(this.convertToMap(icons)));

			// Filter for correct day
			return _.chain(mappedMeals)
				.filter(function(meal) { return new Date(meal.date).toDateString() == date.toDateString(); })
				.sortBy('order')
				.value();
		},
		
		convertToMap: function(icons) {
		    var result = {};
		    for (var index in icons) {
		        var key = icons[index].key;
		        var value = icons[index].value;
		        result[key] = value;
		    }
		    return result;
		},
		
		mapToMeal: function(icons) {
		    return function (meal) {
		        var mealData = {};
				mealData.contentId = _.uniqueId("id_");
		        mealData.title = meal.title;
		        mealData.description = meal.description.replace(/\(.*\)/g, "");
				mealData.date = meal.date;
				mealData.order = meal["@order"];

				mealData.prices = {};
				if (meal.prices) {
					mealData.prices.students = meal.prices.student;
					mealData.prices.staff = meal.prices.staff;
					mealData.prices.guests = meal.prices.guest;
				} else {
					mealData.prices.students = "?";
					mealData.prices.staff = "?";
					mealData.prices.guests = "?";
				}

		        mealData.ingredients = [];
		        if ($.isArray(meal.type)) {
		            for (var typIndex in meal.type) {
		                mealData.ingredients.push(icons[meal.type[typIndex]]);
		            }
		        } else if (meal.type) {
		            mealData.ingredients.push(icons[meal.type]);
		        }

		        return mealData;
		    };
		}
	});

	var MealView = viewUtils.ElementView.extend({
		template: rendertmpl('mensa_meal'),
		postRender: function() {
			this.$el.trigger("create");
		}
	});

	var DayView = Backbone.View.extend({
		
		initialize: function() {
			this.template = rendertmpl('mensa_detail');
			this.listenTo(this.collection, "sync", this.render);
		},
		
		render: function() {
			this.$el.html(this.template({meals: this.collection.toJSON(), location: this.collection.location}));

			var list = this.$(".speiseplan");
			if (list.length > 0) {
				new viewUtils.ListView({
					el: list,
					collection: this.collection,
					view: MealView,
					postRender: function() {
						this.$el.collapsibleset().collapsibleset("refresh");
					}
				}).render();
			}

			this.$el.trigger("create");
			return this;
		}
	});

	var LocationTabView = Backbone.View.extend({

		initialize: function(params) {
			this.mensa = params.mensa;
			this.date = params.date;
		},

		requestFail: function(error) {
			this.trigger("requestFail", error);
		},

		render: function() {
			this.$el.append('<div id="loadingSpinner"></div> \
				<div id="content"></div> \
				<div id="secondLoadingSpinner"></div> \
				<div id="secondContent"></div>');

			var loader = new Menu([], {
				location: this.mensa,
				date: this.date
			});

			new utils.LoadingView({collection: loader, el: this.$("#loadingSpinner")});
			new DayView({collection: loader, el: this.$("#content")});
			this.listenTo(loader, "error", this.requestFail);

			loader.fetch(utils.cacheDefaults());

			if (this.mensa === "griebnitzsee") {
				// Load Ulfs Cafe in second view
				var secondLoader = new Menu([], {
					location: "UlfsCafe",
					date: this.date
				});

				new utils.LoadingView({collection: secondLoader, el: this.$("#secondLoadingSpinner")});
				new DayView({collection: secondLoader, el: this.$("#secondContent")});
				this.listenTo(secondLoader, "error", this.requestFail);

				secondLoader.fetch(utils.cacheDefaults());
			}
		}
	});

	app.views.MensaPage = Backbone.View.extend({
		attributes: {"id": 'mensa'},

		events: {
			'click .ui-input-datebox a': 'dateBox'
		},

		initialize: function() {
			_.bindAll(this, 'render', 'updateMenuData', 'updateMenuCampus');
			this.template = rendertmpl('mensa');
		},

		delegateCustomEvents: function() {
			this.$("div[data-role='campusmenu']").campusmenu({ onChange: this.updateMenuData });
			this.$("#mydate").bind("datebox", this.updateMenuCampus);
		},

		updateMenuData: function(options) {
			// The datebox may not be initiated yet, use the current date as default value
			var date;
			try {
				date = this.$("#mydate").datebox('getTheDate');
			} catch(error) {
				date = new Date();
			}

			this.updateMenu(options.campusName, date);
		},

		updateMenuCampus: function(e, p) {
			if (p.method === "set") {
				var source = this.$("div[data-role='campusmenu']").campusmenu("getActive");
				var date = p.date;
				this.updateMenu(source, date);
			}
		},

		updateMenu: function(mensa, date) {
		    var uniqueDivId = _.uniqueId("id_");
		    
		    this.$("#todaysMenu").empty();
			this.$("#todaysMenu").append('<div id="' + uniqueDivId + '"></div>');

			var locationTab = new LocationTabView({el: this.$("#" + uniqueDivId), mensa: mensa, date: date});
			this.listenTo(locationTab, "requestFail", this.requestFail);
			locationTab.render();
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
		},

		dateBox: function(ev){
			ev.preventDefault();
		},

		render: function() {
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			this.delegateCustomEvents();
			this.$("div[data-role='campusmenu']").campusmenu("pageshow");

			return this;
		}
	});

	return app.views.MensaPage;
});