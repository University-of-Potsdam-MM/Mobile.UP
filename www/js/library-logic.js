var environment = 'development';

var xmlHelper = {};

xmlHelper.textForTag = function(node, tagName) {
  var firstTagNode = node.getElementsByTagName(tagName)[0];
  if (firstTagNode) {
    return firstTagNode.textContent;
  } else {
    return null;
  }
};

xmlHelper.textForQuery = function(jqNode, query) {
  // if (jqNode instanceof jQuery
  return _.pluck(jqNode.find(query), 'textContent');
};

$(document).ready(function() {
  //updateResults();
})

$(document).on("submit","#query-form", function(e) {
  e.preventDefault();
  updateResults();
})

function xmlToBooksArray(xmlSearchResult){
  var records = xmlSearchResult.getElementsByTagName('recordData');
  return _.map(records, book);
};

function book(recordData){
  console.log(recordData);
  var $recordData = $(recordData);
  var model = {
    title:     textForTag(recordData, 'title'),
    subtitle:  textForTag(recordData, 'subTitle'),
    abstract:  textForTag(recordData, 'abstract'),
    toc:       textForTag(recordData, 'tableOfContents'),
    authors:   authors($recordData),
    publisher: textForTag(recordData, 'publisher'),
    isbn:      textForQuery($recordData, 'identifier[type=isbn]')
  };
  console.log(model);
  return model;
}


function textForTag(node, tagName) {
  var firstTagNode = node.getElementsByTagName(tagName)[0];
  if (firstTagNode) {
    return firstTagNode.textContent;
  } else {
    return null;
  }
}

function textForQuery(jqNode, query){
  return _.map(
    jqNode.find(query),
    function(item){ return item.textContent;}
  );
  // return _.pluck(jqNode.find(query), 'textContent');
}

function authors($recordData){
  var nameNodes = $recordData.find('name[type=personal]')
  var names = _.map(nameNodes, function(node){
    var $node = $(node);
    var author = [textForQuery($node, 'namePart[type=family]')[0], textForQuery($node, 'namePart[type=given]')[0]];
    return author;
  });
  console.log('names:',names);
  return names;
}


function updateResults() {

  Q(clearSearch())
  .then(function () {
    var inputs= $("#query-form :input").serializeArray();
    var query = inputs[0].value;
    return loadSearch(query);
  })
  .then(xmlToBooksArray)
  // .then(function (xmlSearchResult) {
  //  var x2js = new X2JS();
    
  //  return x2js.xml2json(searchResult);
  // })
  // .then(function (jsonResponse) {
  //  var jsonResponse = jsonResponse;
  //  jsonResponse = jsonResponse["searchRetrieveResponse"]["records"];
  //  var results = Q(convertToMap(jsonResponse));

  //  return results;
  // })
  .then(renderResults)
  .catch(function (e) {
    console.log(e);
    alert("Fehlschlag: " + JSON.stringify(e));
    });
}

function clearSearch() {
  //$("#searchResults").empty();
}

function loadSearch(query) {
    var d = Q.defer();
    var baseURL;
    var max = 10;

    if ('development' == environment){
      baseURL = '/api/search';
    } else {
      baseURL  = "http://sru.gbv.de";
    }

    var url = baseURL + '/opac-de-517?version=1.1&operation=searchRetrieve&query=' + query + '&maximumRecords=' + max + '&recordSchema=mods';
    console.log(url);
    $.get(url).done(d.resolve).fail(d.reject);
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

function renderResults(results) {
  _.templateSettings.variable = "rc";
  var template = _.template($("#results-template").html());
  $("#search-results").html(template(results)).trigger('create');
}
