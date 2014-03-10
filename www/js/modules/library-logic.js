// TODO: check if internet is available

"use strict";

var App = {
  model:       {}, // model classes
  models:      {}, // actual models
  collection:  {}, // collection classes
  collections: {}, // actual collections
  view:        {}, // view classes
};

// TODO: Standort Informationen am Model
App.model.Book = Backbone.Model.extend({
  // Book instance properties
  initialize: function () {
    // console.log('initialize', this.attributes);
  }

},{
  // Book class properties

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
// END App.model.Book


App.collection.BookList = Backbone.Collection.extend({
  model: App.model.Book,

  // TODO: create object to communicate with SRU and provide pagination for query

  addXmlSearchResult: function(xmlSearchResult){
    // console.log('xml',xmlSearchResult);
    var records = xmlSearchResult.getElementsByTagName('recordData');
    this.add ( _.map(records, App.model.Book.fromXmlRecord ) );
    console.log('addXmlSearchResult', this.pluck('recordId'));
    return this;
  },
});
// END App.collection.BookList

App.model.LibrarySearch = Backbone.Model.extend({
  // LibrarySearch instance properties
  initialize: function(query) {
    this.set('query', query);
    var results = App.collections.searchResults || new App.collection.BookList();
    this.set('results', results);
    this.listenTo(results, 'add', function(){
      // console.log('add to LibrarySearch', this);
    });
  },

  loadNext: function() {
    // fetch the next 10 books
    var q = this.get('query');
    var resultList = this.get('results');
    var options = {startRecord: resultList.length + 1 };
    var fetch = App.model.LibrarySearch.search(q, options);
    var promise = fetch.loadSearch();
    return promise;
  }
}, {
  // LibrarySearch class properties
  search: function(query, options) {
    var defaultOptions = {
      startRecord: 1,
      maximumRecords: 10,
    };
    options = _.defaults(options || {}, defaultOptions);

    // TODO refactor into App.model.LibrarySearch instance properties
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
        var promise = d.promise;
        return promise;
      },

      next: function() {
        this.options.startRecord += this.options.maximumRecords;
        // TODO: update Backbone Collection
        return this.loadSearch();
      }
    })
  }
});

// END App.model.LibrarySearch

App.view.Search = Backbone.View.extend({
  // TODO: this is the main Search Page with everything inside
})

App.view.LibrarySearchView = Backbone.View.extend({
  events: {
    "click .pagination-button" : this.loadNext,
  },
  loadNext: function(){
    console.log('clicked loadNext');
    // debugger
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
    // debugger
    App.models.currentSearch.loadNext();
  });
}

// controller
function registerPagination(){
  $(".pagination-button").click(function(e){
    e.preventDefault();
    App.models.currentSearch.loadNext();
  });
};

// controller
function registerEventChooseBook(){
  $( '#search-results > ul' ).on( 'click', 'li', function(ev){
    // TODO query Standortinfo for this record
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
  .then(renderBookListView)
  .then(registerEventChooseBook)
  .catch(logError);
}

// this is a function i use to migrate to Backbone
// TODO remove it
function addXmlSearchResult(xmlSearchResult) {
  // debugger
  var searchResults = (App.models.currentSearch) ?
    App.models.currentSearch.get('results') :
    new App.collection.BookList();
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
  var $results = $("#search-results");
  $results.html(html);
  registerPagination();
  $results.trigger('create');
}

// TODO create BackboneView
var bookDetailViewTemplate = render('book_detail_view');
function renderDetailView(book) {
  // console.log('render detail', book);
  _.templateSettings.variable = "book";
  var html = bookDetailViewTemplate({book:book});
  var $results = $("#search-results");
  $results.html(html);
  $results.trigger('create');
}

// TODO: this function is here temporarily and should be removed soon
function loadSearch(queryString) {
    var search = new App.model.LibrarySearch(queryString)
    App.models.currentSearch = search;
    var loading = search.loadNext();
    return loading;
};

