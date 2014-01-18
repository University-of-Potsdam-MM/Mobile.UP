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
	        updateMenu(source);
	        
	        // For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
	        activeTabFix(source, event);
	    });
	});
	
	$(document).on("pageshow", "#mensa", function () {
	    var source = $(".ui-btn-active");
	    updateMenu(source);
	});
	
	function updateMenu(source) {
	    var targetMensa = source.attr("href");
		var mensa = targetMensa.slice(1);
	
	    Q(clearMenu())
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
	        .then(drawMeals)
	        .catch(function (e) {
	            alert("Fehlschlag: " + JSON.stringify(e));
	            console.log(e);
	        });
	}
	
	function clearMenu() {
	    $("#todaysMenu").empty();
	}
	
	/**
	 * Loads all meals and some meta data for a given mensa.
	 * @param location One of the values ["Griebnitzsee", "NeuesPalais", "Golm"]
	 */
	function loadMenu(location) {
	    var d = Q.defer();
	    var url = "http://fossa.soft.cs.uni-potsdam.de:8280/services/mensaParserJSON";
	
	    // If we are not in an app environment, we have to use the local proxy
	  /*
	    if (navigator.app === undefined) {
	        url = "/fossa-services/mensaParserJSON";
	    }
	*/
	    $.get(url + "/readCurrentMeals?location=" + location).done(d.resolve).fail(d.reject);
	    return d.promise;
	}
	
	function selectIcons(menu) {
	    return menu.readCurrentMealsResponse.return.iconHashMap.entry;
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
	    return menu.readCurrentMealsResponse.return.gerichte.entry;
	}
	
	function sortMealsByDate(meals) {
	    return meals.sort(function (a, b) {
	        var first = new Date(a.key);
	        var second = new Date(b.key);
	        return first - second;
	    });
	}
	
	/**
	 * Prepare data for day section.
	 * @param icons
	 * @returns {Function}
	 */
	function mapToDay(icons) {
	    return function (day) {
	        var dayData = {};
	        dayData.title = new Date(day.key).toLocaleDateString();
	        dayData.contentId = _.uniqueId("id_");
	        dayData.meals = _.chain(day.value.item).sortBy(sortByAnzeigeprio).map(mapToMeal(icons)).value();
	        return dayData;
	    }
	}
	
	function sortByAnzeigeprio(element) {
	    return element.anzeigeprio;
	}
	
	function mapToMeal(icons) {
	    return function (meal) {
	        var mealData = {};
	        mealData.title = meal.titel;
	        mealData.description = meal.beschreibung;
			mealData.prices = {};
			mealData.prices.students = meal.preise.entry[0].value;
			mealData.prices.staff = meal.preise.entry[1].value;
			mealData.prices.guests = meal.preise.entry[2].value;
	
	        mealData.ingredients = [];
	        if ($.isArray(meal.essenstyp)) {
	            for (var typIndex in meal.essenstyp) {
	                mealData.ingredients.push(icons[meal.essenstyp[typIndex]]);
	            }
	        } else {
	            mealData.ingredients.push(icons[meal.essenstyp]);
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
	    return _.map(meals, mapToDay(icons));
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
	
	function drawMeals(days) {
		
		var createDay = render('mensa');
		
		// Add day section to html
		var htmlDay = createDay(days[1]);
		$("#todaysMenu").append(htmlDay);

		// Tell collapsible set to refresh itself
		$("#todaysMenu").collapsibleset("refresh");

		// Open the first section
		$("#" + days[0].contentId).trigger('expand');
		
}
