// TODO: check if internet is available

var App = {
  model: {}, // model classes
  collection: {}, // collection classes
  collections: {}, //actual collections
  view: {}, // view classes
}

App.model.Book = Backbone.Model.extend({
  // Book instance properties
  initialize: function () {
    console.log('initialize', this.attributes);
  }
},{
  // Book class properties

  // TODO: create Backbone Model
  // TODO: Standort Informationen am Model
  fromXmlRecord: function(xmlRecord) {
    // console.log('xml:', xmlRecord);
    var $xmlRecord = $(xmlRecord);
    var recordId = App.model.Book.textForTag(xmlRecord, 'recordIdentifier');
    var model = {
      id:        recordId,
      recordId:  recordId,
      title:     App.model.Book.textForTag(xmlRecord, 'title'),
      subtitle:  App.model.Book.textForTag(xmlRecord, 'subTitle'),
      abstract:  App.model.Book.textForTag(xmlRecord, 'abstract'),
      toc:       App.model.Book.split_string(App.model.Book.textForTag(xmlRecord, 'tableOfContents'),'--'),
      authors:   App.model.Book.authors($xmlRecord),
      publisher: App.model.Book.textForTag(xmlRecord, 'publisher'),
      isbn:      App.model.Book.textForQuery($xmlRecord, 'identifier[type=isbn]')
    };
    // console.log('model.toc', model.toc);
    return new App.model.Book(model);
  },

  textForTag: function(node, tagName) {
    var firstTagNode = node.getElementsByTagName(tagName)[0];
    if (firstTagNode) {
      return firstTagNode.textContent;
    } else {
      return null;
    }
  },

  split_string: function(string, split_by){
    if (string) {
      return string.split(split_by);
    }
    return null;
  },

  textForQuery: function(jqNode, query){
    return _.pluck(jqNode.find(query), 'textContent');
  },

  // TODO: a view logic that displays only some of the authors (eg: "Gamma et al.")
  authors: function($recordData){
    var nameNodes = $recordData.find('name[type=personal]')
    var names = _.map(nameNodes, function(node){
      var $node = $(node);
      var author = [
        App.model.Book.textForQuery($node, 'namePart[type=family]')[0],
        App.model.Book.textForQuery($node, 'namePart[type=given]')[0]
      ];
      return author;
    });
    // console.log('names:',names);
    return names;
  }

});
// END Book


App.collection.BookList = Backbone.Collection.extend({
  model: App.model.Book,

  // TODO: create object to communicate with SRU and provide pagination for query
  // TODO: store numberOfRecords for search
  addXmlSearchResult: function(xmlSearchResult){
    // console.log('xml',xmlSearchResult);
    var records = xmlSearchResult.getElementsByTagName('recordData');
    // return _.map(records, book);
    this.add ( _.map(records, App.model.Book.fromXmlRecord ) );

    console.log('addXmlSearchResult', this.models);

    return this;
  },

});

App.model.LibrarySearch = Backbone.Model.extend({
  initialize: function(query) {
    this.set('query', query);
  },
  loadNext: function() {
    // fetch the next 10 books
  }
});

App.view.Search = Backbone.View.extend({
  // TODO: this is the main Search Page with everything inside
})

App.view.LibrarySearchView = Backbone.View.extend({
  events: {
    "click .pagination" : this.loadNext,
  },
  loadNext: function(){
    this.model.loadNext();
  }
});

App.view.BookDetailView = Backbone.View.extend({});
App.view.BookShortView = Backbone.View.extend({});

///////////////////////

var environment = 'development';

// debugging controller
$(document).ready(function() {
  registerEventSearch();

  // debugging
  updateResults();
})

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
    debugger
    var book = App.collections.searchResults.get(this.id);
    renderDetailView(book);
  } );
}

// controller
function updateResults() {
  Q(clearSearch)
  .then(getKeyword)
  .then(loadSearch)
  .then(addXmlSearchResult)
  // TODO: adding those books should fire the add event which the view has to listen on
  .then(updateResultsList)
  .then(renderBookListView)
  .then(registerEventChooseBook)
  .catch(logError);
}

// this is a function i use to migrate to Backbone
// TODO remove it
function addXmlSearchResult(xmlSearchResult) {
  var searchResults = new App.collection.BookList();
  App.collections.searchResults = searchResults;
  searchResults.addXmlSearchResult(xmlSearchResult);
  return searchResults.models;
};

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
  // console.log('render detail', book);
  _.templateSettings.variable = "book";
  var html = bookDetailViewTemplate({book:book});
  $results = $("#search-results");
  $results.html(html);
  $results.trigger('create');
}


// TODO: create Backbone Collection
var resultsList = []

function updateResultsList(list) {
  this.resultsList = list;
  return this.resultsList;
}

// function getRecord(recordId){
//   // get book from list with recordId
//   return _.find(this.resultsList, function(book){ return book.recordId == recordId; });
// }

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

    baseURL: function() {
      if ('development' == environment){
        return '/api/search';
      } else {
        return "http://sru.gbv.de";
      }
    },

    url: function() {
      return this.baseURL() + '/opac-de-517?version=1.1&operation=searchRetrieve' +
        '&query=' + this.query +
        '&startRecord=' + this.options.startRecord +
        '&maximumRecords=' + this.options.maximumRecords +
        '&recordSchema=mods';
    },

    loadSearch: function() {
      // TODO: return and memorize Backbone collection instead of promise
      var d = Q.defer();
      var url = this.url();
      $.get(url).done(d.resolve).fail(d.reject);
      return d.promise;
    },

    next: function() {
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








