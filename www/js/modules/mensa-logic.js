	$(document).ready(function () {
	    $.support.cors = true;
	    $.mobile.allowCrossDomainPages = true;
	});
	
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
	}
	
	function updateMenu(mensa, date) {
	    uniqueDivId = _.uniqueId("id_");
		
	    Q(clearTodaysMenu(uniqueDivId))
			.then(addLodingSpinner(uniqueDivId))
	        .then(function () { return loadMenu(mensa); })
	        .then(function (menu) {
	            var meals = Q(selectMeals(menu))
	                .then(sortMealsByDate)
					.then(sortByOrder);
	
	            var icons = Q(selectIcons(menu))
	                .then(convertToMap);
	
	            return [meals, icons];
	        })
	        .spread(prepareMeals)
			.then(filterByDate(date))
	        .then(drawMeals(uniqueDivId))
			.finally(removeLoadingSpinner(uniqueDivId))
	        .catch(function (e) {
	            console.log("Fehlschlag: " + e.stack);
	            alert("Fehlschlag: " + e.stack);
	        });
	}
	
	function clearTodaysMenu(uniqueDivId) {
	    $("#todaysMenu").empty();
		$("#todaysMenu").append("<div id=\"" + uniqueDivId + "\"></div>");
	}
	
	/**
	 * Loads all meals and some meta data for a given mensa.
	 * @param location One of the values ["Griebnitzsee", "NeuesPalais", "Golm"]
	 */
	function loadMenu(location) {
	    var d = Q.defer();
	    var url = "http://usb.soft.cs.uni-potsdam.de/mensaAPI/1.0";
		
		if (location == "griebnitzsee") {
			location = "Griebnitzsee";
		} else if (location == "neuespalais") {
			location = "NeuesPalais";
		} else if (location == "golm") {
			location = "Golm";
		}
		
		headers = { "Authorization": "Bearer 44b61d3e121a2e98db3a26bba804a4"};
		$.ajax({
			url: url + "/readCurrentMeals?format=json&location=" + location,
			headers: headers
		}).done(d.resolve).fail(d.reject);
	    return d.promise;
	}
	
	function selectIcons(menu) {
	    return menu.readCurrentMealsResponse.meals.iconHashMap.entry;
	}
	
	function convertToMap(icons) {
	    var result = {};
	    for (var index in icons) {
	        var key = icons[index].key;
	        var value = icons[index].value;
	        result[key] = value;
	    }
	    return result;
	}
	
	function selectMeals(menu) {
	    return menu.readCurrentMealsResponse.meals.meal;
	}
	
	function sortMealsByDate(meals) {
	    return meals.sort(function (a, b) {
	        var first = new Date(a.key);
	        var second = new Date(b.key);
	        return first - second;
	    });
	}
	
	function sortByOrder(meals) {
		return meals.sort(function (a, b) {
			var first = a["@order"];
			var second = b["@order"];
			return first - second;
		});
	}
	
	function mapToMeal(icons) {
	    return function (meal) {
	        var mealData = {};
			mealData.contentId = _.uniqueId("id_");
	        mealData.title = meal.title;
	        mealData.description = meal.description;
			mealData.date = meal.date;
			
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
	
	/**
	 * Prepare data.
	 * @param meals
	 * @param icons
	 */
	function prepareMeals(meals, icons) {
	    return _.map(meals, mapToMeal(icons));
	}
	
	function filterByDate(date) {
		return function(meals) {
			return _.filter(meals, function(meal) {
				return new Date(meal.date).toDateString() == date.toDateString();
			});
		};
	}
	
	function drawMeals(uniqueDiv) {
		return function(meals) {
			var createMeals = rendertmpl('mensa');
			var host = $("#" + uniqueDiv);
			
			// Add day section to html
			var htmlDay = createMeals({meals: meals});
			host.append(htmlDay);

			// Tell collapsible set to refresh itself
			host.trigger("create");
		}
	}
