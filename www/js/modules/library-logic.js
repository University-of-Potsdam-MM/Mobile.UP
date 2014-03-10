// TODO: check if internet is available

"use strict";
$( function() {
window.App = {
  model:       {}, // model classes
  models:      {}, // actual model instances
  collection:  {}, // collection classes
  collections: {}, // actual collection instances
  view:        {}, // view classes
  views:       {}, // actual view instances
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
    this.set('results', App.collections.searchResults);
  },

  loadNext: function() {
    console.log('loadNext');
    // fetch the next 10 books
    var query = this.get('query');
    var resultList = this.get('results');
    var options = {startRecord: resultList.length + 1 };
    var fetch = App.model.LibrarySearch.search(query, options);
    var promise = fetch.loadSearch();
    promise.done(function(xml) {
      console.log('done', xml);
      resultList.addXmlSearchResult(xml);
    });
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

App.view.BookList = Backbone.View.extend({
  el: '#search-results',
  initialize: function(){
    this.collection.on('add', this.render, this);
  },
  events: {
    "click .pagination-button" : 'loadMore',
    "click li" : 'renderDetail',
  },
  template: render('book_list_view'),
  render: function(){
    console.log('render');
    _.templateSettings.variable = "booklist";
    var html = this.template({booklist:this.collection.models});
    this.$el.html(html);
    this.$el.trigger('create');
    return this;
  },
  loadMore: function(){
    // debugger
    App.models.currentSearch.loadNext();
  },
  renderDetail: function(ev) {
    // TODO query Standortinfo for this record
    // debugger
    ev.preventDefault();
    var bookId = $(ev.target).closest('li').attr('id')
    var book = App.collections.searchResults.get(bookId);
    renderDetailView(book);
  },
});

App.collections.searchResults = new App.collection.BookList();

App.views.SearchResults = new App.view.BookList({
  el: $('#search-results'),
  collection: App.collections.searchResults
});

App.views.SearchResults.render();



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
function registerPagination(){
  $(".pagination-button").click(function(e){
    e.preventDefault();
    App.models.currentSearch.loadNext();
  });
};

// controller
function updateResults() {
  Q(clearSearch)
  .then(getKeyword)
  .then(loadSearch)
  .then(addXmlSearchResult)
  // TODO: adding those books should fire the add event which the view has to listen on
  // .then(renderBookListView)
  // .then(registerEventChooseBook)
  .catch(logError);
}


// TODO: this function is here temporarily and should be removed soon
function loadSearch(queryString) {
    var search = new App.model.LibrarySearch(queryString)
    App.models.currentSearch = search;
    // on adding books render BookListView
    var loading = search.loadNext();
    return loading;
};


// this is a function i use to migrate to Backbone
// TODO remove it
function addXmlSearchResult(xmlSearchResult) {
  // debugger
  var searchResults = App.collections.searchResults;
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

});


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


