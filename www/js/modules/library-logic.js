// TODO: check if internet is available

var environment = 'development';

// debugging controller
$(document).on("pageinit","#search", function() {
  registerEventSearch();

  // debugging
  updateResults();
});

// controller
function registerEventSearch(){
  $("#query-form").on("submit", function(e) {
    e.preventDefault();
    updateResults();
  });
}

// controller
function registerEventChooseBook(){
	$( '#search-results > ul' ).on( 'click', 'li', function(ev){

		// TODO query Standortinfo for this record
		var book = getRecord(this.id);
	    renderDetailView(book);
	    
	    // get position of book for detail request
	    var ajaxCall = $.ajax({
			url: 'http://daia.gbv.de/isil/DE-517?id=ppn:'+book.ppn+'&format=json',
			method: 'GET',
			dataType: 'jsonp'
		});
	    
	    ajaxCall.done(function (json) {
	    	var positions= [];
	  		_.each(json.document[0].item, function(item) {
	  			positions.push(position(item, book));
			});
	  		renderPositionView(positions);
	    }).fail(function () {
	    	console.log('false');
	    });   
	});
}

// controller
function updateResults() {
  Q(clearSearch)
  .then(getKeyword)
  .then(loadSearch)
  .then(xmlToBooksArray)
  .then(updateResultsList)
  .then(renderBookListView)
  .then(registerEventChooseBook)
  .catch(logError);
}


// controller / helper
var logError = function (err) {
  console.log('ErrorMessage', err.message);
  console.log('StackTrace', err.stack);
  alert(err);
  throw err;
}

// view
function getKeyword(){
  var inputs= $("#query-form :input").serializeArray();
  var query = inputs[0].value;
  return query;
}

function clearSearch() {
  // $("#searchResults").empty();
}

// TODO create Backbone View or Marionette Listview
var bookListViewTemplate = render('book_list_view');
function renderBookListView(list) {
  _.templateSettings.variable = "booklist";
  var html = bookListViewTemplate({booklist:list});
  $results = $("#search-results");
  $results.html(html);
  $results.trigger('create');
}

// TODO create BackboneView
var bookDetailViewTemplate = render('book_detail_view');
function renderDetailView(book) {
	console.log('render detail', book);
	_.templateSettings.variable = "book";
	var html = bookDetailViewTemplate({book:book});
	$results = $("#libraryContent");
	$results.html(html);
	$results.trigger('create');
}

// TODO: create BackboneView
var bookLocationViewTemplate = render('book_location_view');
function renderPositionView(positions) {
   console.log('render positions', positions);
	_.templateSettings.variable = "positions";
	var html = bookLocationViewTemplate({positions:positions});
	$results = $("#book-location");
	$results.html(html);
	$results.trigger('create');
}


// TODO: create Backbone Collection
var resultsList = []

function updateResultsList(list) {
  this.resultsList = list;
  return this.resultsList;
}

function getRecord(recordID){
  // get book from list with recordID
  return _.find(this.resultsList, function(book){ return book.recordID == recordID; });
}

// TODO: look here for setting meta data / attributes on a Backbone collection
// http://stackoverflow.com/a/5930838/104959
var LibrarySearch = function(query, options) {
  var defaultOptions = {
    startRecord: 1,
    maximumRecords: 10,
  };
  options = _.defaults(options || {}, defaultOptions);

  return _.extend({
    query:query,
    options: options
  }, {
    baseURL:
      function() {
        if ('development' == environment){
          return '/api/search';
        } else {
          return "http://sru.gbv.de";
        }
      },
    url:
      function() {
        return this.baseURL() + '/opac-de-517?version=1.1&operation=searchRetrieve' +
          '&query=' + this.query +
          '&startRecord=' + this.options.startRecord +
          '&maximumRecords=' + this.options.maximumRecords +
          '&recordSchema=mods';
      },
    loadSearch:
      function() {
        // TODO: return Backbone collection instead of promise
        var d = Q.defer();
        var url = this.url();
        $.get(url).done(d.resolve).fail(d.reject);
        return d.promise;
      },
    next:
      function(){
        this.options.startRecord += this.options.maximumRecords;
        // TODO: update Backbone Collection
        return this.loadSearch();
      }
  });
};

function loadSearch(queryString) {
    var query = new LibrarySearch(queryString)
    return query.loadSearch();
}

// TODO: create object to communicate with SRU and provide pagination for query
// TODO: store numberOfRecords for search
function xmlToBooksArray(xmlSearchResult){
  // console.log('xml',xmlSearchResult);
  var records = xmlSearchResult.getElementsByTagName('zs:recordData');
  return _.map(records, book);
};

// TODO: create Backbone Model
function book(recordData){
  // console.log('xml:', recordData);
  var $recordData = $(recordData);
  var model = {
    recordID:  textForTag(recordData, 'recordIdentifier'),
    title:     textForTag(recordData, 'title'),
    subtitle:  textForTag(recordData, 'subTitle'),
    abstract:  textForTag(recordData, 'abstract'),
    toc:       split_string(textForTag(recordData, 'tableOfContents'),'--'),
    authors:   authors($recordData),
    publisher: textForTag(recordData, 'publisher'),
    edition:   textForTag(recordData, 'edition'),
    dateIssued:textForTag(recordData, 'dateIssued'),
    isbn:      textForQuery($recordData, 'identifier[type=isbn]'),
    url:	   url(recordData),
    ppn:       textForTag(recordData, 'recordIdentifier')
  };
  // console.log('model.toc', model.toc);
  return model;
}

// TODO: create Backbone Model
function position(item, book) {
	var model = {
		department: department(item),
		label: item.label,
		availableitems: availableItems(item, book)
	};
	return model;
}

// get url for a book
function url(recordData) {
	// get first item and check for primary display or usage attribute
	var  urlusage = attributeContentForTag(recordData, 'location', 'usage');
	if (urlusage && (urlusage.indexOf('primary display') != -1)) {
		return textForTag(recordData, 'location');
	} else {
		return null;
	}
}

// creating department string for emplacement
function department($recordData) {
	var department = $recordData.department.content;
	if($recordData.storage) {
		department = department+', '+$recordData.storage.content;
	}
	return department;
}

// complex function to get avialable status of items
// https://github.com/University-of-Potsdam-MM/bibapp-android/blob/develop/BibApp/src/de/eww/bibapp/data/DaiaXmlParser.java
// TODO: iclude expected http://daia.gbv.de/isil/DE-517?id=ppn:684154994&format=json
function availableItems($recordData, book) {
	var item = $recordData;
	var status = '';

	// check for avaiable items
	if (item.available) {
		// check if available items contain loan
		var presentations = _.find(item.available, function(item){
				return item.service =='loan';		
		});
	}
	
	if (presentations) {
		status = 'ausleihbar';
	}else{
		// check for loan in unavailable items
		var loanunavailable = _.find(item.unavailable, function(item){
			return item.service =='loan';		
		});
		if(loanunavailable && loanunavailable.href) {
			if(loanunavailable.href.indexOf("loan/RES") != -1) {
				status = "ausleihbar";
			} else {
				status = "nicht ausleihbar";
			}
		} else {
			if(book.url == null) {
				status = 'nicht ausleihbar';
			}else {
				status = 'Online-Ressource';
			}
		}
	}
	return status;
}

function textForTag(node, tagName) {
  var firstTagNode = node.getElementsByTagName(tagName)[0];
  if (firstTagNode) {
    return firstTagNode.textContent;
  } else {
    return null;
  }
}

function attributeContentForTag(node, tagName, attributeName) {
	var firstTagNode = node.getElementsByTagName(tagName)[0];
	if (firstTagNode) {
		return firstTagNode.getElementsByTagName('url')[0].getAttribute(attributeName);
	} else {
		return null;
	}
}

function split_string(string, split_by){
  if(null == string || undefined == string) {
    return null;
  }
  return string.split(split_by);
}

function textForQuery(jqNode, query){
  return _.pluck(jqNode.find(query), 'textContent');
}

// TODO: a view logic that displays only some of the authors (eg: "Gamma et al.")
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



