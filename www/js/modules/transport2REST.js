define([ 'jquery', 'underscore', 'backbone', 'utils', 'modules/transportREST.util', 'moment'], 
  function($, _, Backbone, utils, transport, moment){

  // "use strict";

  var view_state_from = {campus: 'G-see'};
  var view_state_to = {campus: 'Palais'};

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
   *  Backbone View - TransportListView
   */
  var TransportListView = Backbone.View.extend({

    events: {
      "click #searchButton" : "searchButton",
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater"
    },

    initialize: function(options) {
      this.stations = options.stations;
      this.updateContent(options.collection, options.stationNameFrom, options.stationNameTo, options.stationTime);

      this.template = utils.rendertmpl('complex_transport_listitem');

      this.$ul = this.$el.find('transport_rides');
      _.bindAll(this, 'addOne');
    },

    updateContent: function(stationTrips, stationNameFrom, stationNameTo, stationTime) {
      this.stationNameFrom = stationNameFrom;
      this.stationNameTo = stationNameTo;
      this.stationTime = stationTime;

      // Forget the old collection
      this.collection.off(null, null, this);
      this.collection = stationTrips;

      // Listen to changes in the new collection
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.addOne, this);
    },

    addOne: function(trip) {
      this.$ul.append(this.template({trip: trip}));
    },

    searchLater: function(ev){
      ev.preventDefault();
      this.stations.fetch();
    },

    render: function() {
      this.collection.each(this.addOne);
      return this;
    }
  });


  
  /**
   * BackboneView - Transport2RESTPageView
   * Main View for complex transport search
   */
  var Transport2RESTPageView = Backbone.View.extend({
    attributes: {"id": "transport2"},

    events: {
      'click .ui-input-datebox a': 'datetimeBox'
    },

    initialize: function(){
      this.collection = new TransportStations();
      this.template = utils.rendertmpl('transport2');
      this.listenTo(this, "prepareTrips", this.prepareTrips);
      this.listenTo(this, "renderTransportList", this.renderTransportList);
      this.listenTo(this.collection.where(view_state_from)[0], "sync", _.once(this.renderTransportList));
    },

    renderTransportList: function(){
      transportViewTransportList = new TransportListView({
        el: this.$el.find('#result'),
        stations: this.collection,
        collection: this.collection.where(view_state_from)[0].get('trips'),
        stationNameFrom: this.collection.where(view_state_from)[0].get('name'),
        stationNameTo: view_state_to.campus,
        stationTime: this.collection.where(view_state_from)[0].get('stationTime')
      });
      transportViewTransportList.render();
    },

    datetimeBox: function(ev){
      ev.preventDefault();
    },

    prepareTrips: function(){
      this.LoadingView = new utils.LoadingView({collection: this.collection.where(view_state_from)[0], el: this.$("#loadingSpinner")});

      // check for existing trips otherwise fetch
      if (this.collection.where(view_state_from)[0].get('trips').length == 0){
        this.collection.fetch();
      }else{
        this.trigger("renderTransportList");
      }
    },

    render: function(){
      this.$el.html(this.template({}));
      var that = this;

      fromStation = new NavigationView({el: this.$el.find("#fromStation2")});
      fromStation.on('select', function(buttonName){
        view_state_from = {campus: buttonName};
        console.log(view_state_from);
        first_trip = that.collection.where(view_state_from)[0];
        transportViewTransportList.updateContent(first_trip.get('trips'), first_trip.get('name'), first_trip.get('stationTime'));
        transportViewTransportList.render();
      });

      toStation = new NavigationView({el: this.$el.find("#toStation2")});
      toStation.on('select', function(buttonName){
        view_state_to = {campus: buttonName};
        console.log(view_state_to);

      });

      this.$el.trigger("create");
      this.trigger('prepareTrips');
      return this;
    }
  });


  /**
   * Backbone View - ComplexSearchView
   * view for the complex search view
   */
  var ComplexSearchView = Backbone.View.extend({

    // initialize: function(){
    //   var query = this.model;
    //   var resultList = this.collection;
    //   this.templateListItem =utils.rendertmpl('complex_transport_listitem');
    //   resultList.on('reset', this.renderResults, this);
    //   resultList.on('add', this.render, this);
    //   _.bindAll(this, 'spinnerOn', 'spinnerOff');
    // },

    // events:{
    //   "click #searchButton" : "searchButton",
    //   "click #earlierButton": "searchEarlier",
    //   "click #laterButton"  : "searchLater",
    // },

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

  return Transport2RESTPageView;

});