define([ 'jquery', 'underscore', 'backbone', 'utils', 'modules/transportREST.util', 'moment'], 
  function($, _, Backbone, utils, transport, moment){

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
      "click #searchButton" : "searchTrips",
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater"
    },

    initialize: function(options) {
      this.trip = options.campusTrip;
      // Forget the old collection
      this.collection.off(null, null, this);
      this.collection = options.campusTrip.connections;

      // Listen to changes in the new collection
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.addOne, this);

      this.template = utils.rendertmpl('complex_transport_listitem');

      this.$ul = this.$el.find('transport_rides');
      _.bindAll(this, 'addOne');
    },

    addOne: function(trip) {
      this.$ul.append(this.template({trip: trip}));
    },

    searchTrips: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    searchEarlier: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    searchLater: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    render: function() {
      this.$ul.empty();
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
      this.model = new CampusTrip();
      this.template = utils.rendertmpl('transport2');
      this.listenTo(this, "prepareTrips", this.prepareTrips);
      this.listenTo(this, "renderTransportList", this.renderTransportList);
    },

    renderTransportList: function(){
      transportViewTransportList = new TransportListView({
        el: this.$el.find('#result'),
        campusTrip: this.model
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

  return Transport2RESTPageView;

});