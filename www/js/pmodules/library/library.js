/*
authors: @rmetzler, @alekiy

First of all, I have to say I'm sorry that the code isn't yet as clean and readable
as it should be. We started to build this in generic JavaScript and than wanted to
refactor it into Backbone. This was way harder than expected without breaking any
previously working functionality. Please don't judge.

## TODOS
- display "zs:diagnostics" "diag:message" element (namespace'http://www.loc.gov/zing/srw/diagnostic/')
- display availability information in the BookListView
*/

"use strict";
define(['jquery', 'underscore', 'backbone', 'utils', 'moment'], function($, _, Backbone, utils, moment){
  var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/library");


  window.App = {
    model:       {}, // model classes
    models:      {}, // actual model instances
    collection:  {}, // collection classes
    collections: {}, // actual collection instances
    view:        {}, // view classes
    views:       {}, // actual view instances
  };


  /**
   *  Backbone Model - Book
   *  TODO: Standort Informationen am Model
   */
  App.model.Book = Backbone.Model.extend({

    /* nearly parsing, substitue it with parse function */
    initialize: function(){
      var xmlRecord = this.get('xmlRecord');
      var $xmlRecord = $(this.get('xmlRecord'));
      var recordId = this.textForTag(xmlRecord, 'recordIdentifier');

      this.set('id', recordId);
      this.set('ppn', recordId);
      this.set('title', this.getTitle(xmlRecord));
      this.set('subtitle', this.textForTag(xmlRecord, 'subTitle'));
      this.set('partNumber', this.textForTag(xmlRecord, 'partNumber'))
      this.set('dateIssued', this.textForTag(xmlRecord, 'dateIssued'));
      this.set('abstract', this.textForTag(xmlRecord, 'abstract'));
      this.set('toc', this.split_string(this.textForTag(xmlRecord, 'tableOfContents'),'--'));
      this.set('authors', this.authors($xmlRecord));
      this.set('publisher', this.textForTag(xmlRecord, 'publisher'));
      this.set('isbn', this.textForQuery($xmlRecord, 'identifier[type=isbn]'));
      this.set('url', this.textForQuery($xmlRecord, 'url[usage="primary display"]'));
      this.set('notes', this.contentForTag(xmlRecord, 'note'));
      this.set('series', this.textForQuery($xmlRecord, 'relatedItem[type=series]'));
      this.set('keywords', this.keywords(xmlRecord, 'subject'));
      this.set('mediaType', this.mediaType(xmlRecord));
      this.set('extent', this.textForTag(xmlRecord, 'extent'));
      this.set('edition', this.textForTag(xmlRecord, 'edition'));
      this.set('place', this.firstNode($xmlRecord, 'placeTerm[type=text]'));
      this.set('issuance', this.textForTag(xmlRecord, 'issuance'));
      // holding statement for magazines
      this.set('enumerationAndChronology', this.textForTag(xmlRecord, 'enumerationAndChronology'));
    },

    // TODO Refactor using  fetch in BookLocationList
    updateLocation: function() {
      // get's bookLocation information and set's it at the book model
      var spinner = utils.addLoadingSpinner("book-locations");
      spinner();

      var currentBook = this;
      var ajaxLocationCall = $.ajax({
        url: 'https://daia.gbv.de/isil/DE-517?id=ppn:'+this.get('ppn')+'&format=json',
        method: 'GET',
        dataType: 'jsonp'
      });

      ajaxLocationCall.done(function (json) {
      	var bookLocationList = new App.collection.BookLocationList();

        _.map(json.document[0].item, function(item) {
          var bookLocation = new App.model.BookLocation({});
          bookLocationList.add(bookLocation.getLocation(item, currentBook));
        });

        var spinner = utils.removeLoadingSpinner("book-locations");
        spinner();
        var locationView = new App.view.LocationView({collection: bookLocationList});
        locationView.render();
      }).fail(function (error) {
      	var errorPage = new utils.ErrorView({el: '#book-locations', msg: 'Der Standort-Dienst ist momentan nicht erreichbar.', module: 'library', err: error});
      });

    },

    textForTag: function(node, tagName) {
      var firstTagNode = node.getElementsByTagName(tagName)[0];
      return (firstTagNode) ? firstTagNode.textContent : null;
    },

    split_string: function(string, split_by){
      return (string) ? string.split(split_by) : null;
    },

    textForQuery: function(jqNode, query){
      var nodes = _.pluck(jqNode.find(query), 'textContent');
      return (nodes && nodes.length != 0) ? nodes : null;
    },

    getTitle: function(node){
      var title = this.textForTag(node, 'title');
      var nonSort = this.textForTag(node, 'nonSort');
      return (nonSort!=null) ? nonSort + " " + title : title;
    },

    authors: function($recordData){
      var nameNodes = $recordData.find('name[type=personal]')
      var that = this;
      var names = _.map(nameNodes, function(node){
        var $node = $(node);
        var author = [
          (that.textForQuery($node, 'namePart[type=family]')) ? that.textForQuery($node, 'namePart[type=family]')[0] : '',
          (that.textForQuery($node, 'namePart[type=given]')) ? that.textForQuery($node, 'namePart[type=given]')[0] : ''
        ];
        return author;
      });
      return names;
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
      var keywords = this.contentForTag(node, tagName);
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

      var typeOfResource = this.contentForTag(node, 'typeOfResource');
      var originInfo = this.contentForTag(node, 'originInfo');
      var issuance = this.contentForTag(node, 'issuance');
      //TODO: test for essay
      var isEssay = false;
      var mediaType = "X";

      if ( physicalDescription != null && physicalDescription == "microform" ){
        mediaType = "E";
      }else if ( typeOfResource != null && typeOfResource == "manuscript" ){
        mediaType = "H";
      }else if ( isEssay == true ){
        mediaType = "A";
      }else{
        if ( typeOfResource != null ){
          if ( typeOfResource == "still image" ){
            mediaType = "I";
          }else if ( typeOfResource == "sound recording-musical" ){
            mediaType = "G";
          }else if ( typeOfResource == "sound recording-nonmusical" ){
            mediaType = "G";
          }else if ( typeOfResource == "sound recording" ){
            mediaType = "G";
          }else if ( typeOfResource == "cartographic" ){
            mediaType = "K";
          }else if ( typeOfResource == "notated music" ){
            mediaType = "M";
          }else if ( typeOfResource == "moving image" ){
            mediaType = "V";
          }else if ( typeOfResource == "text" ){
            if ( originInfo != null && ( issuance == "serial" || issuance == "continuing" ) ){
              mediaType = "T";
            }else{
              mediaType = "B";
            }
          }else if ( typeOfResource == "software, multimedia" ){
            if ( originInfo != null && ( issuance == "serial" || issuance == "continuing" ) ){
              if ( physicalDescription != null && physicalDescription == "remote" ){
                mediaType = "P";
              }else{
                mediaType = "T";
              }
            }
            else{
              if ( physicalDescription != null && physicalDescription == "remote" ){
                mediaType = "O";
              }else{
                mediaType = "S";
              }
            }
          }
        }
      }
      mediaType = "media_"+mediaType.toLowerCase();
      return mediaType;
    },

    contentForTag: function(node, tagName){
      var nodes = node.getElementsByTagName(tagName);
      if (nodes && nodes.length != 0) {
      return _.pluck(nodes, 'textContent');
      } else {
        return null;
      }
    },

    firstNode: function(jqNode, query){
      var nodes = this.textForQuery(jqNode, query);
      if(nodes) {
        return nodes[0];
      }else{
        return null;
      }
    }
  });


  /**
   *  Backbone Collection - BookList
   */
  App.collection.BookList = Backbone.Collection.extend({
    model: App.model.Book,
  });


  /*
   *  Backbone Model - LibrarySearch
   *  holding all necessary values for the current search
   */
  App.model.LibrarySearch = Backbone.Model.extend({
    defaults: {
      query: '',
      options: '',
      startRecord: 1,
      maximumRecords: 10
    },

    baseUrl: 'https://apiup.uni-potsdam.de/endpoints/libraryAPI',

    initialize: function(){
      this.listenTo(this, "error", this.requestFail);
    },

    paginationPossible: function(){
      return (this.get('results').length < this.get('numberOfRecords'));
    },

    endPagination: function() {
      return Math.min(this.get('results').length + 10, this.get('numberOfRecords'));
    },

    loadNext: function() {
      // fetch the next 10 books
      var query = this.get('query');
      var resultList = this.get('results');
      this.set('startRecord', resultList.length + 1);

      this.generateUrl();
      this.fetch();
      $('input[type="submit"]').removeAttr('disabled');
    },

    requestFail: function(error) {
      var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Die Bibliothekssuche ist momentan nicht erreichbar.', module: 'library', err: error});
    },

    byTagNS: function(xml,tag,ns) {
      return xml.getElementsByTagNameNS ?
        xml.getElementsByTagNameNS(ns,tag) :
        xml.getElementsByTagName(ns+":"+tag);
    },

    parse: function(data){
      // get relevant pagination information
      if(data.getElementsByTagNameNS) {
        if (!data.getElementsByTagNameNS('http://www.loc.gov/zing/srw/','numberOfRecords')[0]){
          this.set('numberOfRecords',0);
        }else{
          var numberOfRecords=data.getElementsByTagNameNS('http://www.loc.gov/zing/srw/','numberOfRecords')[0].textContent;
          this.set('numberOfRecords',numberOfRecords);
        }
      }else{
        var numberOfRecords=data.getElementsByTagName('http://www.loc.gov/zing/srw/'+':'+'numberOfRecords')[0].textContent;
        this.set('numberOfRecords',numberOfRecords);
      }
      var records = this.byTagNS(data, 'recordData', 'http://www.loc.gov/zing/srw/');
      var that= this;
      _.map(records, function(record) {
        that.get('results').add(new App.model.Book({xmlRecord: record}));
      });
    },

    fetch: function(options){
      options = options || {};
      options.dataType = "xml";
      return Backbone.Model.prototype.fetch.call(this, options);
    },

    generateUrl: function() {
      this.url = this.baseUrl + '/operation=searchRetrieve' +
        '&query=' + this.get('query') +
        '&startRecord=' + this.get('startRecord') +
        '&maximumRecords=' + this.get('maximumRecords') +
        '&recordSchema=mods';
    }
  });
  // END App.model.LibrarySearch


  /**
   * Backbone View - BookList
   * displays the list of search results
   */
  App.view.BookList = Backbone.View.extend({
    el: '#search-results',

    events: {
      'click ul.booklist li.book-short' : 'renderDetail',
      'click input' : 'loadMore'
    },

    initialize: function(){
      this.template = rendertmpl('library_list_view');
      this.model.on('change', this.render, this);
      this.collection.on('add', this.render, this);
    },

    render: function(){
      var search = App.models.currentSearch;

      var html = this.template({
        search:             search.attributes,
        paginationPossible: search.paginationPossible(),
        endPagination:      search.endPagination(),
        booklist: this.collection.models
      });
      this.$el.html(html);
      this.$el.trigger('create');
      return this;
    },

    loadMore: function(ev){
      ev.preventDefault();
      $('#loadNext').attr('disabled', 'disabled');
      App.models.currentSearch.loadNext();
      $('html, body').animate({scrollTop: $(document).height()}, 300);
    },

    renderDetail: function(ev) {
      ev.preventDefault();
      var bookId = $(ev.target).closest('li.book-short').attr('id');
      var book = App.collections.searchResults.get(bookId);

      var BookDetailView = new App.view.BookDetailView({model: book});
      BookDetailView.render();
	  app.route('library/library/detail', true);
      book.updateLocation();
    }
  });


  /**
   * Backbone View - BookDetailView
   * displays the detail information of a given book
   */
  App.view.BookDetailView = Backbone.View.extend({
    el: '#library',
    model: App.model.Book,

    initialize: function(){
      this.template = rendertmpl('library_detail_view');
    },

    render: function(){
      var html = this.template({book:this.model});
      this.$el.html(html);
      this.$(".infotext-header-show").show();
      this.$(".infotext-header-hide").hide();
      this.$(".infotext").collapsible({

        collapse: function() {
          $(".infotext-header-show").show();
          $(".infotext-header-hide").hide();
        },

        expand: function() {
          $(".infotext-header-show").hide();
          $(".infotext-header-hide").show();
        }
      });
      this.$el.trigger('create');
      app.viewManager.updateHeader(this.$el);
      return this;
    }
  });


  /**
   * Backbone View - LocationView
   * displays the location information of a given book
   */
  App.view.LocationView = Backbone.View.extend({
    el: '#book-locations',
    collection: App.collection.BookLocationList,

    initialize: function(){
      this.template = rendertmpl('library_location_view');
    },

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
        departmentURL: this.getDepartmentURL(item),
        label: item.label,
        item: this.getItem(item, book),
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

    getDepartmentURL: function(recordData){
      return recordData.department.id;
    },

    // complex function to get avialable status of items
    // https://github.com/University-of-Potsdam-MM/bibapp-android/blob/develop/BibApp/src/de/eww/bibapp/data/DaiaXmlParser.java
    // TODO: limitation expected http://daia.gbv.de/isil/DE-517?id=ppn:684154994&format=json
    getItem: function(item, book){
      var status = '';
      var statusInfo = '';
      // reset url when in daia response unavailable service item openaccess is existing
      if (book.get('mediaType') == "media_o"){
        var url =  (item.unavailable && item.unavailable[0].service == "openaccess") ? item.unavailable[0].href : null;
        if (url != null){
          book.set('url', url);
        }
      }

      // check for avaiable and unavailable items and process loan and presentation
      // ignore interloan
      if (item.available){
          var loanAvailable = _.find(item.available, function(item){
            return item.service =='loan';
          });
          var presentationAvailable = _.find(item.available, function(item){
              return item.service =='presentation';
            });
      }
      if (item.unavailable){
        var loanUnavailable = _.find(item.unavailable, function(item){
              return item.service =='loan';
            });
        var presentationUnavailable = _.find(item.unavailable, function(item){
              return item.service =='presentation';
            });
      }

      // check for loanable items like LBS
      if (loanAvailable) {
        status = 'ausleihbar';

        if(presentationAvailable){
          // tag available with service="loan" and href=""?
          if (presentationAvailable.limitation){
            statusInfo = presentationAvailable.limitation[0].content;
          }
          if(loanAvailable.href==""){
            statusInfo += "Bitte bestellen";
          }
        }

      }else{
        // check for loan in unavailable items
        // indicates LBS and Online-Resources
          if(loanUnavailable && loanUnavailable.href) {
            if(loanUnavailable.href.indexOf("loan/RES") != -1) {
              status = "ausleihbar";
            }else{
              status = "nicht ausleihbar";
            }
          }else{
            // if there is no url then it will be a presentation
            if(book.attributes.url == null) {
              if (item.label && item.label.indexOf("bestellt") != -1){
                status = item.label;
                statusInfo = "";
              }else{
                status = 'Präsenzbestand';
                if (presentationAvailable.limitation){
                  statusInfo = presentationAvailable.limitation[0].content;
                }
              }
            }else{
              status = 'Online-Ressource im Browser öffnen';
            }
          }

          if(presentationUnavailable)
            if(loanUnavailable.href) {
              if(loanUnavailable.href.indexOf("loan/RES") != -1) {
                status ="ausgeliehen";
                if (!loanUnavailable.expected || loanUnavailable.expected == "unknown"){
                  statusInfo += "ausgeliehen, Vormerken möglich";
                }else{
                  // print loanUnavailable.expected in human readable form
                  statusInfo += "ausgeliehen bis ";
                  statusInfo += moment(loanUnavailable.expected, "YYYY-MM-DD").format("DD.MM.YYYY");
                  statusInfo += ", Vormerken möglich";
                }
              }
            } else {
              statusInfo += "...";
            }
      }
      return [status, statusInfo];
      }
  });


  App.collection.BookLocationList = Backbone.Collection.extend({
      model: App.model.BookLocation,

      comparator: function(model1, model2){
        if (model1.get('department').indexOf("Handapparat") == -1){
          if (model1.get('department') > model2.get('department')){
            return 1;
          }else{
            return -1;
          }
        }else{
          return 1;
        }
      }
  });

  /**
   *  Initial State of Library Search
   */
  App.collections.searchResults = new App.collection.BookList();

  App.models.currentSearch = new App.model.LibrarySearch({
    query:'',
    numberOfRecords: 0,
    results: App.collections.searchResults
  });

  /**
   * Backbone View - Search
   * Main View for submitting search requests
   */
  app.views.LibraryIndex = Backbone.View.extend({
    attributes: {"id": 'library'},

    events: {
      'submit form': 'loadSearch',
      'click .backToList': 'back'
    },

    initialize: function(){
      this.template = rendertmpl('library');
    },

    render: function(){
      this.$el.html(this.template({keyword: App.models.currentSearch.get('query')}));
	  this.page.html(this.$el);
      // initialize Main Views
      App.view.SearchResults = new App.view.BookList({
        model: App.models.currentSearch,
        collection: App.collections.searchResults,
        el: this.$el.find("#search-results")
      });

      App.view.SearchResults.render();
      this.$el.trigger('create');
      return this;
    },

    loadSearch: function(ev){
      ev.preventDefault();
      $('input[type="submit"]').attr('disabled', 'disabled');
      var inputs = $('#query-form :input').serializeArray();
      var query = inputs[0].value;
      if(this.LoadingView){
        this.LoadingView.stopListening();
      }
      this.LoadingView = new utils.LoadingView({model: App.models.currentSearch, el: this.$("#loadingSpinner")});

      App.collections.searchResults.reset();

      var search = App.models.currentSearch.set({
        query: query,
        results: App.collections.searchResults,
      });
      // on adding books render BookListView
      var loading = search.loadNext();
    },

     back: function(ev){
        ev.preventDefault();
        this.render();
    }
  });

  return app.views;
});