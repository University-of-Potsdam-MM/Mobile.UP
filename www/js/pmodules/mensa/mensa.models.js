define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'stateful.models'
], function($, _, Backbone, utils, models) {

    var Menu = models.StatefulCollection.extend({

        initialize: function(models, options) {
            this.location = options.location;
            this.date = options.date;
        },

        url: function() {
            var mapper = {
                "griebnitzsee": "Griebnitzsee",
                "neuespalais": "NeuesPalais",
                "golm": "Golm",
                "UlfsCafe": "UlfsCafe"
            };
            return "https://api.uni-potsdam.de/endpoints/mensaAPI/2.0/meals?location=" + mapper[this.location];
        },

        parse: function(response) {
            // Map data format
            var date = this.date;
            var icons = response.iconHashMap.entry;
            var meals = response.meal;
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
                mealData.allergens = meal.allergens;

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

    var locations = ["griebnitzsee", "neuespalais", "golm"];

    var AllMenus = Backbone.Model.extend({

        initialize: function() {
            this.listenTo(this, "change:date", this._updateDate);

            _.each(locations, function(location) {
                var menus = createMenus(location, new Date());
                this.set(location, menus);
            }, this);
        },

        _updateDate: function(model, value) {
            console.log("_updateDate called");

            _.each(locations, function(location) {
                var menus = this.get(location);
                _.each(menus, function(menu) {
                    menu.date = value;
                });
            }, this);

            this.fetchAll();
        },

        fetchAll: function (options) {
            options = options || utils.cacheDefaults();

            _.each(locations, function(location) {
                var menus = this.get(location);
                _.each(menus, function(menu) {
                    menu.fetch(options);
                });
            }, this);
        }
    });

    var createMenus = function(mensa, date) {
        var result = [];

        result.push(new Menu(null, {
            location: mensa,
            date: date
        }));

        if (mensa === "griebnitzsee") {
            // Load Ulfs Cafe in second view
            result.push(new Menu(null, {
                location: "UlfsCafe",
                date: date
            }));
        }

        return result;
    };

    return {
        Menu: Menu,
        AllMenus: AllMenus,
        createMenus: createMenus
    };
});
