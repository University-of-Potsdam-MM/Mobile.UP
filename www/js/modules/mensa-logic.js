function activeTabFix(target, event) {
	    event.preventDefault();
	    $(".location-menu").removeClass("ui-btn-active");
	    target.addClass("ui-btn-active");
}

	$(document).ready(function () {
	    $.support.cors = true;
	    $.mobile.allowCrossDomainPages = true;
	});
	
	$(document).on("pageinit", "#mensa", function () {
	    $(".location-menu").bind("click", function (event) {
	        var source = $(this);
			var date = $("#mydate").datebox('getTheDate');
	        updateMenu(source, date);
	        
	        // For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
	        activeTabFix(source, event);
	    });
		
		$("#mydate").bind("datebox", function(e, p) {
			if (p.method === "set") {
				var source = $(".ui-btn-active");
				var date = p.date;
				updateMenu(source, date);
			}
		});
	});
	
	$(document).on("pageshow", "#mensa", function () {
		activateDefaultMensa();
		
	    var source = $(".ui-btn-active");
		var date = $("#mydate").datebox('getTheDate');
	    updateMenu(source, date);
	});
	
	function activateDefaultMensa() {
		var defaultMensa = getDefaultMensa();
		
		if (!defaultMensa) {
			var source = $(".location-menu-default")
			defaultMensa = retreiveMensa(source);
			setDefaultMensa(defaultMensa);
		}
		
		$(".location-menu").removeClass("ui-btn-active");
		var searchExpression = "a[href='#" + defaultMensa + "']";
		$(searchExpression).addClass("ui-btn-active");
	}
	
	function updateMenu(mensaSource, date) {
	    var mensa = retreiveMensa(mensaSource);
		setDefaultMensa(mensa);
		
		uniqueDivId = _.uniqueId("id_");
		
	    Q(clearMenu(uniqueDivId))
	        .then(function () { return loadMenu(mensa); })
	        .then(function (menu) {
	            var meals = Q(selectMeals(menu))
	                .then(sortMealsByDate)
	
	            var icons = Q(selectIcons(menu))
	                .then(convertToMap);
	
	            return [meals, icons];
	        })
	        .spread(prepareMeals)
	        .then(filterEmptyMeals)
			.then(filterByDate(date))
	        .then(drawMeals(uniqueDivId))
	        .catch(function (e) {
	            console.log("Fehlschlag: " + e.stack);
	            alert("Fehlschlag: " + e.stack);
	        });
	}
	
	function retreiveMensa(mensaSource) {
		var targetMensa = mensaSource.attr("href");
		return targetMensa.slice(1);
	}
	
	function setDefaultMensa(mensa) {
		localStorage.setItem("mensa.default", mensa);
	}
	
	function getDefaultMensa() {
		return localStorage.getItem("mensa.default");
	}
	
	function clearMenu(uniqueDivId) {
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
	
	    // If we are not in an app environment, we have to use the local proxy
	    /*
	    if (navigator.app === undefined) {
	        url = "/usb-services/mensaAPI/1.0";
	    }
		*/
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
	
	function sortByAnzeigeprio(element) {
	    return element.anzeigeprio;
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
	        } else {
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
	
	/**
	 * Filter a meal if its description is empty.
	 * @param days
	 * @returns {Array|*|j.map}
	 */
	function filterEmptyMeals(days) {
	    return _.map(days, function (day) {
	        day.meals = _.filter(day.meals, function (meal) {
	            return meal.description != "";
	        });
	        return day;
	    });
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
			var createMeals = render('mensa');
			var host = $("#" + uniqueDiv);
			
			// Add day section to html
			var htmlDay = createMeals({meals: meals});
			host.append(htmlDay);

			// Tell collapsible set to refresh itself
			host.trigger("create");
		}
	}
