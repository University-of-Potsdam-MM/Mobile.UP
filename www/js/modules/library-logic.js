
$(document).ready(function() {
	//updateResults();
})

$(document).on("submit","#query-form", function(e) {
	e.preventDefault();
	updateResults();
})

function updateResults() {

	Q(clearSearch())
	.then(function () {
		var inputs= $("#query-form :input").serializeArray();
		var query = inputs[0].value;
		return loadSearch(query);
	})
	.then(function (searchResult) {
		var x2js = new X2JS();
		
		return x2js.xml2json(searchResult);
	})
	.then(function (jsonResponse) {
		var jsonResponse = jsonResponse;
		jsonResponse = jsonResponse["searchRetrieveResponse"]["records"];
		var results = Q(convertToMap(jsonResponse));

		return results;
	})
	.then(drawResults)
	.catch(function (e) {
        alert("Fehlschlag: " + JSON.stringify(e));
    });		
}

function clearSearch() {
	//$("#searchResults").empty();
}

function loadSearch(query) {
    var d = Q.defer();
    var url = "http://fossa.soft.cs.uni-potsdam.de:8280/services/SRU?version=1.1&operation=searchRetrieve&recordSchema=mods&maximumRecords=10&query=";
    $.get(url + query).done(d.resolve).fail(d.reject);
    return d.promise;
}

function convertToMap(jsonResponse) {
	var results = [];
	console.log(jsonResponse);
	
	for (var i=0; i<10;i++) {
		var entry = {};
		if ('titleInfo' in jsonResponse["record"][i]["recordData"]["mods"]) {
			if ('title' in jsonResponse["record"][i]["recordData"]["mods"]["titleInfo"]) {
				entry.title = jsonResponse["record"][i]["recordData"]["mods"]["titleInfo"]["title"];
			} else {
				entry.title = jsonResponse["record"][i]["recordData"]["mods"]["titleInfo"]["subTitle"];
			}
		}
		results.push(entry);
	}

	return results;
}

function drawResults(results) {
	_.templateSettings.variable = "rc";
	var template = _.template($("#results-template").html());
	$("#search-results").html(template(results)).trigger('create');
}