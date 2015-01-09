define(['jquery', 'underscore', 'backbone', 'utils', 'q', 'modules/campusmenu','datebox', 'lib/jqm-datebox.mode.calbox.min', 'lib/jqm-datebox.mode.datebox.min', 'lib/jquery.mobile.datebox.i18n.de.utf8'], function($, _, Backbone, utils, Q, campusmenu, datebox){

	$(document).on("pageinit", "#mensa", function () {
		$("div[data-role='campusmenu']").campusmenu({ onChange: updateMenuData });

		$("#mydate").bind("datebox", function(e, p) {
			if (p.method === "set") {
				var source = $("div[data-role='campusmenu']").campusmenu("getActive");
				var date = p.date;
				updateMenu(source, date);
			}
		});
	});

	$(document).on("pageshow", "#mensa", function () {
		$("div[data-role='campusmenu']").campusmenu("pageshow");
	});

	function updateMenuData(options) {
			var date = $("#mydate").datebox('getTheDate');
			updateMenu(options.campusName, date);
		};

	function updateMenu(mensa, date) {
	    uniqueDivId = _.uniqueId("id_");

	    Q(clearTodaysMenu(uniqueDivId))
			.then(utils.addLoadingSpinner(uniqueDivId))
	        .then(function () { return loadMenu(mensa, date); })
			.then(drawMeals(uniqueDivId))
			.fin(utils.removeLoadingSpinner(uniqueDivId))
	        .fail(function (error) {
	            var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
	        });
	};

	function clearTodaysMenu(uniqueDivId) {
	    $("#todaysMenu").empty();
		$("#todaysMenu").append("<div id=\"" + uniqueDivId + "\"></div>");
	};
	
	var MenuLoader = Backbone.Model.extend({
		
		fetch: function() {
			var meals = new Menu({location: this.location});
			this.listenTo(meals, "sync", this.prepare);
			this.listenTo(meals, "error", function() { this.trigger("error"); });
			meals.fetch();
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
			}
			this.url = "https://api.uni-potsdam.de/endpoints/mensaAPI/1.0/readCurrentMeals?format=json&location=" + location;
		},
		
		parse: function(response) {
			var icons = response.readCurrentMealsResponse.meals.iconHashMap.entry;
			var meals = response.readCurrentMealsResponse.meals.meal;
			return _.map(meals, this.mapToMeal(icons));
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

	/**
	 * Loads all meals and some meta data for a given mensa.
	 * @param location One of the values ["Griebnitzsee", "NeuesPalais", "Golm"]
	 */
	function loadMenu(location, date) {
	    var d = Q.defer();
	    
	    var loader = new MenuLoader();
	    loader.location = location;
	    loader.date = date;
	    
	    loader.on("error", function(error){
	    	var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
	    });
	    loader.on("sync", function() {
	    	d.resolve(loader.meals);
	    });
	    
	    loader.fetch();
	    
	    return d.promise;
	};
	
	var DayView = Backbone.View.extend({
		
		initialize: function() {
			this.template = utils.rendertmpl('mensa_detail');
		},
		
		render: function() {
			var html = this.template({meals: this.collection});
			this.$el.append(html);
			this.$el.trigger("create");
		}
	});

	function drawMeals(uniqueDiv) {
		return function(meals) {
			new DayView({collection: meals, el: $("#" + uniqueDiv)}).render();
		}
	};

	var MensaPageView = Backbone.View.extend({
		attributes: {"id": 'mensa'},

		events: {
			'click .ui-input-datebox a': 'dateBox'
		},

		initialize: function() {
			_.bindAll(this, 'render');
			this.template = utils.rendertmpl('mensa');
		},

		dateBox: function(ev){
			ev.preventDefault();
		},

		render: function() {
			$(this.el).html(this.template({}));
			this.$el.trigger("create");
			return this;
		}
	});

	return MensaPageView;
});