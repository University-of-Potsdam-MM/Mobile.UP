define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'pmodules/transport/transport.util',
  'moment'
], function($, _, Backbone, utils, transport, moment){
  var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/transport");

 /*
  ## Dependencies
  - jQuery
  - moment.js

  ## Working Functionality
  - make ajax POST request
  - map API XML data into JavaScript objects, uses Deferreds
  - moment.js parses and formats timestrings
  - switch between stations
  - 'pagination': get more departing times (journeys)
  - started Backbone View
  - verbindungVonNach

  ## TODO
  - verbindungVonNach: date + time, pagination
  - parsing durations
  - better objects
  - event 'pagebeforeshow' -> find out if need to fetch journeys
  - prevent breaking if buttons are renamed (Button mapping is done by simply using button text. There should be a better mapping method)
  */

  "use strict";

  window.Transport = {
    model: {},
    collection: {},
    views: {},
    view: {},
  };

  Transport.collection.TransportsCollection = new Backbone.Collection();

  var collection = Transport.collection.TransportsCollection;

  collection.on('add', function(journey){
    // console.log(journey.attributes);
    // console.log("next departure " + journey.get('departingTime').fromNow())
  });

  /**
   * Backbone Model - StateModel
   * holds internal state for complex transport search
   */
  Transport.StateModel = Backbone.Model.extend({

    defaults:{
      depTime: moment(),
      connections: new Backbone.Collection(),
      from: "G-see",
      to: "Palais"
    },

    addTime: function(units, value) {
      this.get('depTime').add(units, value);
    },

    setFromStation: function(string) {
      if (this.get('to') == string) {
        // if to and from are equal, both should switch
        this.set('to', this.get('from'));
      }
      this.set('from', string);
    },

    setToStation: function(string) {
      if (this.get('from') == string) {
        // if to and from are equal, both should switch
        this.set('from', this.get('to'));
      }
      this.set('to', string);
    },

    fromStation: function(){
      return this.get('stations').where({campus: this.get('from')})[0];
    },

    toStation: function(){
      return this.get('stations').where({campus: this.get('to')})[0];
    },

    resetConnections: function(newConnections){
      this.get('connections').reset(newConnections);
    },

    fetchConnections: function(){
      console.log('DateTime for connection:', this.get('depTime').format('DD.MM.YYYY - HH:mm') );
      var that = this;
      transport.getVerbindung(
        this.fromStation().get('externalId'),
        this.toStation().get('externalId'),
        this.get('depTime')
        //this.get('arrivalMode')
      ).done(function(connections){
        that.resetConnections(connections);
      });
    }
  });

  /**
   * BackboneView - ComplexSearchView
   * view for the complex search view
   */
  Transport.views.ComplexSearchView = Backbone.View.extend({

    initialize: function(){
      var query = this.model;
      var resultList = this.collection;
      this.templateListItem =rendertmpl('complex_transport_listitem');
      resultList.on('reset', this.renderResults, this);
      resultList.on('add', this.render, this);
      _.bindAll(this, 'spinnerOn', 'spinnerOff');
    },

    events:{
      "click #searchButton" : "searchButton",
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater",
    },

    searchButton: function() {
      this.model.set('depTime', this.getMoment());
      this.search();
    },

    search: function(){
      this.spinner();
      this.model.fetchConnections();
      this.renderSummary();
    },

    searchEarlier: function(){
      this.model.addTime('minutes', -30);
      this.search();
    },

    searchLater: function(){
      this.model.addTime('minutes', 30);
      this.search();
    },

    spinner: function(){
      var view = this;
      view.spinnerOn();
      _.each(this.collection, function(station){
        view.collection.once('add', view.spinnerOff);
      });
    },

    spinnerOn:  utils.addLoadingSpinner('transport_rides'),
    spinnerOff: utils.removeLoadingSpinner('transport_rides'),

    // returns a momentjs object for Transportation Date + Time
    getMoment: function() {
      var date = this.getDate();
      var time = this.getTime();
      if ('Heute' === date) {
        if ('Jetzt' === time) {
          // Heute & Jetzt
          return moment();
        } else {
          // Heute + specific time
          // time should be parseable in the format
          // '09:59 AM'
          return moment(time, 'HH:mm');
        }
      } else {
        // date should be parseable
        var mDate = moment(date, "DD MM YYYY");
        var mTime;
        if ('Jetzt' === time) {
          // current time but on a specific date
          mTime = moment();
        } else {
          // parse time
          mTime = moment(time, 'HH:mm')
        }

        // setting minutes and hours on the mDate object
        mDate.hours(mTime.hours());
        mDate.minutes(mTime.minutes());
        return mDate;
      }
    },

    getDate: function(){
      // we shouldn't store data in the DOM,
      // but I don't know how to access this in another way
      var val = this.$el.find('#transportationDate').val();
      return val;
    },

    getTime: function(){
      // we shouldn't store data in the DOM,
      // but I don't know how to access this in another way
      var val = this.$el.find('#transportationTime').val()
      return val;
    },

    render: function(){
      this.renderScrollButtons();
      this.renderResults();
      return this;
    },

    renderScrollButtons: function(){
      if (this.collection.isEmpty()){
        this.$el.find('#result .scrollbutton').hide();
      } else {
        this.$el.find('#result .scrollbutton').show();
      }
    },

    renderSummary: function(){
      var q = this.model;
      this.$el.find('#summary .fromCampus').html(q.fromStation().name);
      this.$el.find('#summary .toCampus').html(q.toStation().name);
      this.$el.find('#summary .when').html(q.get('depTime').format('DD.MM.YY HH:mm'));
    },

    renderResults: function(){
      //console.log('render results', this.collection);

      this.renderScrollButtons();

      var view = this;
      var resultList = this.$el.find('#transport_rides');
      resultList.html('');
      this.collection.each(function(connection){
        var html = view.templateListItem({connection: connection});
        resultList.append(html);
      });
      resultList.trigger('create');
      return this;
    }
  });

  /**
   * Backbone View - NavigationView
   */
  var NavigationView = Backbone.View.extend({
    events: {
      'click a' : 'selectButton'
    },

    activeButton: function(buttonText){
      this.$el.find('a').removeClass('ui-btn-active');
      this.$el.find('a').filter(function(){
        return $(this).text() === buttonText;
      }).addClass('ui-btn-active');
    },

    selectButton: function(ev){
      ev.preventDefault();
      var buttonName = $(ev.target).html();
      this.trigger('select', buttonName);
    }
  });


  /**
   * BackboneView - Transport2PageView
   * Main View for complex transport search
   */
  app.views.Transport2Page = Backbone.View.extend({
    attributes: {"id": "transport2"},

    events: {
      'click .ui-input-datebox a': 'datetimeBox'
    },

    initialize: function(){
      this.template = rendertmpl('transport2');

      this.collection = new transport.TransportStations();

      if (Transport.model.State){
        // reset Transport.model.State.reset();
      }else{
        Transport.model.State = new Transport.StateModel({stations: this.collection});
      }
    },

    datetimeBox: function(ev){
      ev.preventDefault();
    },

    render: function(){
      this.$el.html(this.template({}));
	    // Listen for Events from station
	    Transport.view.FromStation = new NavigationView({
	      el: this.$el.find("#fromStation2")
	    });

	    Transport.view.FromStation.on('select', function(buttonName){
	      Transport.model.State.setFromStation(buttonName);
	    });

	    Transport.model.State.on('change:from', function(ev, buttonText){
	      Transport.view.FromStation.activeButton(buttonText);
	    });

	    // Listen for events to station
	    Transport.view.ToStation = new NavigationView({
	      el: this.$el.find("#toStation2"),
	    });

	    Transport.view.ToStation.on('select', function(buttonName){
	      Transport.model.State.setToStation(buttonName);
	    });

	    Transport.model.State.on('change:to', function(ev, buttonText){
	      Transport.view.ToStation.activeButton(buttonText);
	    });

	    Transport.view.ComplexSearch = new Transport.views.ComplexSearchView({
	      el: this.$el.find('#complexTransport'),
	      model: Transport.model.State,
	      collection: Transport.model.State.get('connections')
	    });
	    Transport.view.ComplexSearch.render();

      this.$el.trigger("create");
      return this;
    }
  });

  return  app.views.Transport2Page;

});