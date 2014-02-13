var environment = 'development';

$(document).ready(function() {
  // debugging
  updateResults();
})

$(document).on("submit","#query-form", function(e) {
  e.preventDefault();
  updateResults();
})

// TODO: create object to communicate with SRU and provide pagination for query
// TODO: store numberOfRecords for search
function xmlToBooksArray(xmlSearchResult){
  console.log('xml',xmlSearchResult);
  var records = xmlSearchResult.getElementsByTagName('recordData');
  return _.map(records, book);
};

function book(recordData){
  console.log('xml:', recordData);
  var $recordData = $(recordData);
  var model = {
    // TODO: maybe add ID?
    title:     textForTag(recordData, 'title'),
    subtitle:  textForTag(recordData, 'subTitle'),
    abstract:  textForTag(recordData, 'abstract'),
    toc:       textForTag(recordData, 'tableOfContents'),
    authors:   authors($recordData),
    publisher: textForTag(recordData, 'publisher'),
    isbn:      textForQuery($recordData, 'identifier[type=isbn]')
  };
  console.log('model:', model);
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
  return _.pluck(jqNode.find(query), 'textContent');
}

// TODO: a view logic that displays only some of the authors (eg: Gamma et al.)
function authors($recordData){
  var nameNodes = $recordData.find('name[type=personal]')
  var names = _.map(nameNodes, function(node){
    var $node = $(node);
    var author = [
      textForQuery($node, 'namePart[type=family]')[0],
      textForQuery($node, 'namePart[type=given]')[0]
    ];
    return author;
  });
  // console.log('names:',names);
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
  .then(renderResults)
  .catch(errorLogging);
}

function clearSearch() {
  //$("#searchResults").empty();
}

function loadSearch(query) {
    var d = Q.defer();
    var baseURL;
    var startRecord = 1;
    var maximumRecords = 10;

    if ('development' == environment){
      baseURL = '/api/search';
    } else {
      baseURL  = "http://sru.gbv.de";
    }

    var url = baseURL + '/opac-de-517?version=1.1&operation=searchRetrieve' +
              '&query=' + query +
              '&startRecord=' + startRecord +
              '&maximumRecords=' + maximumRecords +
              '&recordSchema=mods';
    console.log(url);
    $.get(url).done(d.resolve).fail(d.reject);
    return d.promise;
}


function renderResults(results) {
  console.log(results);
  _.templateSettings.variable = "rc";
  var template = _.template($("#lib-results-template").html());
  var html = template(results);
  $("#search-results").html(html).trigger('create');
}

var errorLogging = function (e) {
  console.log(e);
  alert("Fehlschlag: " + JSON.stringify(e));
}
