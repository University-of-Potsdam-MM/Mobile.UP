/*

This is the JavaScript code for the library search functionality.

authors: @rmetzler, @alekiy

First of all, I have to say I'm sorry that the code isn't yet as clean and readable
as it should be. We started to build this in generic JavaScript and than wanted to
refactor it into Backbone. This was way harder than expected without breaking any
previously working functionality. Please don't judge.

## Working Functionality:
- searching for query string and displaying Books in a BookListView
- displaying details of a selected Book
- displaying location information for the selected Book
- Pagination for getting more Books from the API

## TODOS
- check if internet is available and display warning if not
- display availability information in the BookListView
- maybe add a finite state machine or a router to simplify the code

*/

"use strict";
(function($) {

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
    },

    updateLocation: function() {
      // get's bookLocation information and set's it at the book model

      console.log('updateLocation');

      var currentBook = this;

      var ajaxLocationCall = $.ajax({
        url: 'http://daia.gbv.de/isil/DE-517?id=ppn:'+this.get('ppn')+'&format=json',
        method: 'GET',
        dataType: 'jsonp'
      });

      ajaxLocationCall.done(function (json) {
    	var bookLocationList = new App.collection.BookLocationList();
    	console.log('init', bookLocationList);
        _.map(json.document[0].item, function(item) {
        	//console.log('Item:', item);
        	var bookLocation = new App.model.BookLocation({});
        	console.log(bookLocation.getLocation(item, currentBook));

        	bookLocationList.add(bookLocation.getLocation(item, currentBook));
        });
        //console.log('List', bookLocationList);
        var locationView = new App.view.LocationView({collection: bookLocationList});
        locationView.render();
      }).fail(function () {
        console.log('false');
      });

    },

  },{
    // Book class properties

    fromXmlRecord: function(xmlRecord) {
      // console.log('xml:', xmlRecord);
      var $xmlRecord = $(xmlRecord);
      var recordId = App.model.Book.textForTag(xmlRecord, 'recordIdentifier');
      var model = {
        id:        recordId,
        recordId:  recordId,
        ppn:       recordId,
        title:     App.model.Book.textForTag(xmlRecord, 'title'),
        // TODO remove brackets[] if there are some around the subtitle
        subtitle:  App.model.Book.textForTag(xmlRecord, 'subTitle'),
        dateIssued: $xmlRecord.find('dateIssued').html(),
        abstract:  App.model.Book.textForTag(xmlRecord, 'abstract'),
        toc:       App.model.Book.split_string(App.model.Book.textForTag(xmlRecord, 'tableOfContents'),'--'),
        authors:   App.model.Book.authors($xmlRecord),
        publisher: App.model.Book.textForTag(xmlRecord, 'publisher'),
        isbn:      App.model.Book.textForQuery($xmlRecord, 'identifier[type=isbn]'),
        url:       App.model.Book.url(xmlRecord),
        notes:	   App.model.Book.contentForTag(xmlRecord, 'note'),
    		series:	   App.model.Book.textForQuery($xmlRecord, 'identifier[type=series]'),
    		keywords:  App.model.Book.keywords(xmlRecord, 'subject'),
    		mediaType: App.model.Book.mediaType(xmlRecord)
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
    },

    //TODO refactor
    url: function(recordData) {
      // get first item and check for primary display or usage attribute
      var  urlusage = this.attributeContentForTag(recordData, 'location', 'usage');
      if (urlusage && (urlusage.indexOf('primary display') != -1)) {
        return (this.textForTag(recordData, 'location') || "").trim();
      } else {
        return null;
      }
    },

    //TODO refactor
    attributeContentForTag: function (node, tagName, attributeName) {
      var firstTagNode = node.getElementsByTagName(tagName)[0];
      if (firstTagNode && firstTagNode.getElementsByTagName('url')[0]) {
        return firstTagNode.getElementsByTagName('url')[0].getAttribute(attributeName);
      } else {
        return null;
      }
    },

    // filters keywordsm, trims from leading and trailing whitespaces & generates url for keyword link
    keywords: function(node, tagName){
  	  var keywords = App.model.Book.contentForTag(node, tagName);
  	  var keys = _.map(keywords, function(keyword){
  		  var url = 'http://opac.ub.uni-potsdam.de/DB=1/SET=1/TTL=2/MAT=/NOMAT=T/CMD?ACT=SRCHA&IKT=5040&TRM='+encodeURIComponent(keyword.trim());
  		  var key = [keyword.trim(), url];
  		  return key;
  	  });
  	  return keys;
    },

    mediaType: function(node) {
    	var $node = $(node);

    	// get physcialDescription
    	var physicalDescriptionForms = $node.find('form[authority]');

    	var physicalDescription = _.filter(physicalDescriptionForms,  function(form){
    		var $form = $(form);
    		if (typeof $form[0] != "undefined") {
    			return $form[0].textContent == "remote" || $form[0].textContent == "microform";
    		}
    	});
    	if (typeof physicalDescription[0] != "undefined") {
    		physicalDescription = physicalDescription[0].textContent;
    	}

    	//TODO: read typeOfResource
    	var typeOfResource = App.model.Book.getTypeOfResource(node);
    	var originInfo = App.model.Book.contentForTag(node, 'originInfo');
    	//TODO: test for essay
    	var isEssay = false;
    	var mediaType = "X";

		if ( physicalDescription != null && physicalDescription == "microform" )
		{
			mediaType = "E";
		}
		else if ( typeOfResource != null && typeOfResource == "manuscript" )
		{
			mediaType = "H";
		}
		else if ( isEssay == true )
		{
			mediaType = "A";
		}
		else
		{
			if ( typeOfResource != null )
			{
				if ( typeOfResource == "still image" )
				{
					mediaType = "I";
				}
				else if ( typeOfResource == "sound recording-musical" )
				{
					mediaType = "G";
				}
				else if ( typeOfResource == "sound recording-nonmusical" )
				{
					mediaType = "G";
				}
				else if ( typeOfResource == "sound recording" )
				{
					mediaType = "G";
				}
				else if ( typeOfResource == "cartographic" )
				{
					mediaType = "K";
				}
				else if ( typeOfResource == "notated music" )
				{
					mediaType = "M";
				}
				else if ( typeOfResource == "moving image" )
				{
					mediaType = "V";
				}
				else if ( typeOfResource == "text" )
				{
					// TODO: Test with Linux-Magazin
					if ( originInfo != null && ( originInfo == "serial" || originInfo == "continuing" ) )
					{
						mediaType = "T";
					}
					else
					{
						mediaType = "B";
					}
				}
				else if ( typeOfResource == "software, multimedia" )
				{
					if ( originInfo != null && ( originInfo == "serial" || originInfo == "continuing" ) )
					{
						if ( physicalDescription != null && physicalDescription == "remote" )
						{
							mediaType = "P";
						}
						else
						{
							mediaType = "T";
						}
					}
					else
					{
						if ( physicalDescription != null && physicalDescription == "remote" )
						{
							mediaType = "O";
						}
						else
						{
							mediaType = "S";
						}
					}
				}
			}
		}

    	//console.log(mediaType);
    	mediaType = "media_"+mediaType.toLowerCase();
    	return mediaType;
    },

    getTypeOfResource: function(node) {
    	var typeOfResource = App.model.Book.contentForTag(node, 'typeOfResource');
    	return typeOfResource;
    },

    contentForTag: function(node, tagName){
  	  var nodes = node.getElementsByTagName(tagName);
  	  return _.pluck(nodes, 'textContent');
    },


  });
  // END App.model.Book



  App.collection.BookList = Backbone.Collection.extend({
    model: App.model.Book,

    // TODO: create object to communicate with SRU and provide pagination for query

    addXmlSearchResult: function(xmlSearchResult){
      // console.log('xml',xmlSearchResult);
      var records = this.byTagNS(xmlSearchResult, 'recordData', 'http://www.loc.gov/zing/srw/');
      this.add ( _.map(records, App.model.Book.fromXmlRecord ) );
      console.log('addXmlSearchResult', this.pluck('recordId'));
      return this;
    },

    byTagNS: function(xml,tag,ns) {
      return xml.getElementsByTagNameNS ?
        xml.getElementsByTagNameNS(ns,tag) :
        xml.getElementsByTagName(ns+":"+tag);
    },

  });

  // END App.collection.BookList

  App.model.LibrarySearch = Backbone.Model.extend({
    // LibrarySearch instance properties
    initialize: function() {
      // attribute to set in the model:
      // - 'query' (String)
      // - 'results' (App.collection.BookList)
    },

    loadNext: function() {
      console.log('loadNext');
      var model = this;
      // fetch the next 10 books
      var query = this.get('query');
      var resultList = this.get('results');
      var options = {startRecord: resultList.length + 1 };
      var fetch = App.model.LibrarySearch.search(query, options);
      var promise = fetch.loadSearch();
      promise.then(function(xml){
        // get relevant pagination information
        var $xml = $(xml);
        var numberOfRecords = $xml.find('numberOfRecords').text();
        model.set('numberOfRecords', numberOfRecords);
        return xml;
      }).done(function(xml) {
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
  
  /**
   * Backbone - Views
   * 
   * 
   */
  
  /**
   * Backbone View - Search
   * Main View for submitting search requests
   */
  App.view.Search = Backbone.View.extend({
	  el: '#libraryContent',
	  template: rendertmpl('book_search'),
	  
	  events: {
		  'submit form': 'submit'
		  
	  },
	  
	  render: function(){
		  var html = this.template({});
		  this.$el.html(html);
		  this.$el.trigger('create');
		  return this;
	  },
	  
	  submit: function(e){
		  e.preventDefault();
		  updateResults();
		  console.log('submit');
	  }    
  });
  
  
  /**
   * Backbone View - BookList
   * displays the list of search results
   */
  App.view.BookList = Backbone.View.extend({
    el: '#search-results',

    initialize: function(){
      this.model.on('change', this.render, this);
      this.collection.on('add', this.render, this);
    },

    events: {
      "click .pagination-button" : 'loadMore',
      "click ul.booklist li.book-short" : 'renderDetail',
    },

    template: rendertmpl('book_list_view'),
    render: function(){
      console.log('render');
      var html = this.template({
        search: App.models.currentSearch.attributes,
        booklist: this.collection.models
      });
      this.$el.html(html);
      this.$el.trigger('create');
      return this;
    },

    loadMore: function(){
      App.models.currentSearch.loadNext();
    },

    renderDetail: function(ev) {
      // TODO query Standortinfo for this record
      ev.preventDefault();
      var bookId = $(ev.target).closest('li.book-short').attr('id')
      var book = App.collections.searchResults.get(bookId);
      //console.log(book);
      var BookDetailView = new App.view.BookDetailView({
          model: book
        });
      BookDetailView.render();

      book.updateLocation();
    },
  });
  
  
  /**
   * Backbone View - BookDetailView
   * displays the detail information of a given book
   */
  App.view.BookDetailView = Backbone.View.extend({
	  el: '#libraryContent',
	  model: App.model.Book,

	  events: {
		  "click .backToList" : 'back'
	  },

	  template: rendertmpl('book_detail_view'),
	  render: function(){
		  //console.log('render detail', this.model);
		  var html = this.template({book:this.model});
		  this.$el.html(html);
	      this.$el.trigger('create');
	      return this;
	  },

	  // TODO:
	  back: function(){
		  console.log('clicked');
		  App.view.Search.render();
		  App.view.SearchResults = new App.view.BookList({
        model: App.models.currentSearch,
        collection: App.collections.searchResults
      });
		  App.view.SearchResults.render();
		  return this;
	  }

  });

  App.collections.searchResults = new App.collection.BookList();

  App.view.BookShortView = Backbone.View.extend({});


  /**
   * Backbone View - LocationView
   * displays the location information of a given book
   */
  App.view.LocationView = Backbone.View.extend({
	  el: '#book-locations',
	  collection: App.collection.BookLocationList,
	  template: rendertmpl('book_location_view'),
	  
	  render: function(){
		  var html = this.template({locations:this.collection.models});
		  this.$el.html(html);
	      this.$el.trigger('create');
	      return this;
	  }
  });

  
  /**
   * Backbone Model - BookLocation
   * Model for the location 
   * @param item (response from daia)
   * @param book (backbone book model)
   */
  App.model.BookLocation = Backbone.Model.extend({

	  getLocation: function(item, book){
		  var model = {
				  department: this.getDepartment(item),
			      label: item.label,
			      availableitems: this.getAvailableItems(item, book),
			      url: book.attributes.url
			      };
		  return new App.model.BookLocation(model);
	  },

	  // creating department string for emplacement
	  getDepartment: function(recordData){
		  var department = recordData.department.content;
		  if(recordData.storage) {
		      department = department+', '+recordData.storage.content;
		    }
		  return department;
	  },

	  // TODO: Refactor
	  // complex function to get avialable status of items
	  // https://github.com/University-of-Potsdam-MM/bibapp-android/blob/develop/BibApp/src/de/eww/bibapp/data/DaiaXmlParser.java
	  // TODO: iclude expected http://daia.gbv.de/isil/DE-517?id=ppn:684154994&format=json
	  getAvailableItems: function(item, book){
		  var status = '';

		  // check for avaiable items
		  if (item.available) {
		      	//check if available items contain loan
		      	var presentations = _.find(item.available, function(item){
		      		return item.service =='loan';
		      	});
		  }
		  if (presentations) {
			  status = 'ausleihbar';
		  } else {
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
		          status = 'Online-Ressource im Browser öffnen';
		        }
		      }
		  }
		  return status;
	  	}
  });


  App.collection.BookLocationList = Backbone.Collection.extend({
	    model: App.model.BookLocation
  });



  //////////////////////////////////////////////
  // below this line is old non Backbone code //
  //////////////////////////////////////////////

  var environment = 'development';

  // debugging controller
  $(document).on("pageinit", "#search", function () {
    console.log('pageinit #search');

    App.models.currentSearch = new App.model.LibrarySearch({
      query:'',
      numberOfRecords: 0,
      results: new Backbone.Collection()
    });

    App.view.Search = new App.view.Search();
    App.view.Search.render();

    // initialize Main Views
    App.view.SearchResults = new App.view.BookList({
      model: App.models.currentSearch,
      collection: App.collections.searchResults
    });
    App.view.SearchResults.render();

    // debugging
    updateResults();
  });

  // controller
  function registerPagination(){
    $(".pagination-button").click(function(e){
      e.preventDefault();
      App.models.currentSearch.loadNext();
    });
  };

  // controller
  function updateResults() {
    // debugger
    Q(clearSearch)
    .then(getKeyword)
    .then(loadSearch)
    .then(addXmlSearchResult)
    .catch(logError);
  }


  // TODO: this function is here temporarily and should be removed soon
  function loadSearch(queryString) {
    console.log('loadSearch');

    if (App.collections.searchResults) {
      App.collections.searchResults.reset();
    } else {
      App.collections.searchResults = new App.collection.BookList();
    }

    var search = App.models.currentSearch.set({
      query: queryString,
      results: App.collections.searchResults,
    });

    // on adding books render BookListView
    var loading = search.loadNext();
    return loading;
  };


  // this is a function i use to migrate to Backbone
  // TODO remove it
  function addXmlSearchResult(xmlSearchResult) {
    console.log('addXmlSearchResult');

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

})(jQuery);