define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    var Menu = Backbone.Collection.extend({

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
            return "https://api.uni-potsdam.de/endpoints/mensaAPI/1.0/readCurrentMeals?format=json&location=" + mapper[this.location];
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
        createMenus: createMenus
    };
});
