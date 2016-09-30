define(['jquery', 'underscore', 'backbone', 'utils', 'q', 'modules/campusmenu','datebox', 'view.utils'], function($, _, Backbone, utils, Q, campusmenu, datebox, viewUtils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/mensa");

	$(document).on("pageshow", "#mensa", function () {
		console.log("pageshow started");
		$("div[data-role='campusmenu']").campusmenu("pageshow");
		console.log("pageshow finished");
	});

	var MenuLoader = Backbone.Model.extend({
		
		fetch: function() {
			this.trigger("request");
			var meals = new Menu({location: this.location});
			this.listenTo(meals, "sync", this.prepare);
			this.listenTo(meals, "error", function() { this.trigger("error"); });
			meals.fetch(utils.cacheDefaults());
		},
		
		prepare: function(meals) {
			var date = this.date;
			this.meals = meals.chain()
							.filter(function(meal) { return new Date(meal.get("date")).toDateString() == date.toDateString(); })
							.sortBy('order')
							.map(function(data) { return data.toJSON(); })
							.value();
			this.trigger("sync");
		}
	});
	
	var Menu = Backbone.Collection.extend({
		
		initialize: function(params) {
			var location = params.location;
			if (location == "griebnitzsee") {
				location = "Griebnitzsee";
			} else if (location == "neuespalais") {
				location = "NeuesPalais";
			} else if (location == "golm") {
				location = "Golm";
			} else if (location == "UlfsCafe") {
				location = "UlfsCafe";
			}
			this.url = "https://api.uni-potsdam.de/endpoints/mensaAPI/1.0/readCurrentMeals?format=json&location=" + location;
		},
		
		parse: function(response) {
			var icons = response.readCurrentMealsResponse.meals.iconHashMap.entry;
			var meals = response.readCurrentMealsResponse.meals.meal;
			return _.map(meals, this.mapToMeal(this.convertToMap(icons)));
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
			this.listenTo(this.model, "sync", this.render);
		},
		
		render: function() {
			this.$el.html(this.template({meals: this.model.meals, location: this.model.location}));

			var list = this.$(".speiseplan");
			if (list.length > 0) {
				new viewUtils.ListView({
					el: list,
					collection: new Backbone.Collection(this.model.meals),
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

	app.views.MensaPage= Backbone.View.extend({
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
			var date = this.$("#mydate").datebox('getTheDate');
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
		    uniqueDivId = _.uniqueId("id_");
		    
		    this.$("#todaysMenu").empty();
			this.$("#todaysMenu").append('<div id="' + uniqueDivId + '"><div id="loadingSpinner"></div><div id="content"></div><div id="secondLoadingSpinner"></div><div id="secondContent"></div></div>');
			
			var loader = new MenuLoader();
		    loader.location = mensa;
		    loader.date = date;
		    
		    new utils.LoadingView({model: loader, el: this.$("#" + uniqueDivId + " #loadingSpinner")});
		    new DayView({model: loader, el: this.$("#" + uniqueDivId + " #content")});
		    this.listenTo(loader, "error", this.requestFail);

		    loader.fetch();

		    if (mensa === "griebnitzsee") {
		    	// Load Ulfs Cafe in second view
		    	var secondLoader = new MenuLoader();
		    	secondLoader.location = "UlfsCafe";
		    	secondLoader.date = date;

		    	new utils.LoadingView({model: secondLoader, el: this.$("#" + uniqueDivId + " #secondLoadingSpinner")});
		    	new DayView({model: secondLoader, el: this.$("#" + uniqueDivId + " #secondContent")});
		    	this.listenTo(secondLoader, "error", this.requestFail);

		    	secondLoader.fetch();
		    }
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
		},

		dateBox: function(ev){
			ev.preventDefault();
		},

		render: function() {
			$(this.el).html(this.template({}));
			this.$el.trigger("create");
			this.delegateCustomEvents();
			return this;
		}
	});

	return app.views.MensaPage;
});